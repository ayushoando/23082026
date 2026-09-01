// @vitest-environment node
//
// Feature: planner-local-backup (2026-09-01/02 fixes)
//
// Module-level coverage for the Planner canvas IndexedDB safety net. No
// fake-indexeddb package is used — a minimal in-memory IndexedDB stub is
// hand-rolled and installed on globalThis.indexedDB. The stub implements
// only what plannerLocalBackup touches: open + onupgradeneeded/onsuccess/
// onerror, transaction/objectStore, and put/get/delete with async event
// dispatch (handlers are assigned after the call, like the real API).

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearLocalBackup,
  loadLocalBackup,
  saveLocalBackup,
} from "@planner/lib/plannerLocalBackup";

const DB_NAME = "ooplanner-backup";
const STORE_NAME = "canvas";

type EventHandler = (() => void) | null | undefined;

interface StubIdbRequest<TResult = unknown> {
  result: TResult;
  error: Error | null;
  onsuccess: EventHandler;
  onerror: EventHandler;
  onupgradeneeded: EventHandler;
}

interface StubIdbObjectStore {
  put(value: Record<string, unknown>): StubIdbRequest;
  get(key: string): StubIdbRequest<Record<string, unknown> | undefined>;
  delete(key: string): void;
}

interface StubIdbTransaction {
  objectStore(name: string): StubIdbObjectStore;
  error: Error | null;
  oncomplete: EventHandler;
  onerror: EventHandler;
}

interface StubIdbDatabase {
  objectStoreNames: { contains(name: string): boolean };
  createObjectStore(
    name: string,
    options: { keyPath?: string },
  ): StubIdbObjectStore;
  transaction(name: string, mode?: string): StubIdbTransaction;
  close(): void;
}

interface OpenCall {
  name: string;
  version: number;
}

interface InstallOptions {
  /** When true, every open() request fails via req.onerror. */
  failOpen?: boolean;
}

interface StubHandle {
  /** Backing entries for (DB_NAME, STORE_NAME), keyed by projectId. */
  peekEntry(key: string): Record<string, unknown> | undefined;
  openCalls: OpenCall[];
}

const globalScope = globalThis as unknown as Record<string, unknown>;
const originalIndexedDB = globalScope.indexedDB;

function fire(handler: EventHandler): void {
  setTimeout(() => {
    if (typeof handler === "function") handler();
  }, 0);
}

function installStubIndexedDB(options: InstallOptions = {}): StubHandle {
  // dbName -> storeName -> key -> entry
  const registry = new Map<
    string,
    Map<string, Map<string, Record<string, unknown>>>
  >();
  const openCalls: OpenCall[] = [];

  const makeRequest = <T,>(result?: T): StubIdbRequest<T> => ({
    result: result as T,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  });

  const storeMapFor = (
    stores: Map<string, Map<string, Record<string, unknown>>>,
    name: string,
  ): Map<string, Record<string, unknown>> => {
    let store = stores.get(name);
    if (!store) {
      store = new Map();
      stores.set(name, store);
    }
    return store;
  };

  const makeTransaction = (
    stores: Map<string, Map<string, Record<string, unknown>>>,
  ): StubIdbTransaction => {
    const tx: StubIdbTransaction = {
      objectStore: (name) => {
        const entries = storeMapFor(stores, name);
        const store: StubIdbObjectStore = {
          put: (value) => {
            const req = makeRequest();
            setTimeout(() => {
              entries.set(String(value.projectId), value);
              fire(req.onsuccess);
            }, 0);
            return req;
          },
          get: (key) => {
            const req = makeRequest<Record<string, unknown> | undefined>(
              entries.get(key),
            );
            setTimeout(() => fire(req.onsuccess), 0);
            return req;
          },
          delete: (key) => {
            entries.delete(key);
            // Real IDB completes the transaction after the delete request;
            // clearLocalBackup awaits tx.oncomplete.
            setTimeout(() => fire(tx.oncomplete), 0);
          },
        };
        return store;
      },
      error: null,
      oncomplete: null,
      onerror: null,
    };
    return tx;
  };

  const makeDatabase = (
    stores: Map<string, Map<string, Record<string, unknown>>>,
  ): StubIdbDatabase => ({
    objectStoreNames: { contains: (name) => stores.has(name) },
    createObjectStore: (name) => {
      storeMapFor(stores, name);
      return makeTransaction(stores).objectStore(name);
    },
    transaction: (name) => makeTransaction(stores),
    close: () => {
      // Real close() invalidates the connection; the stub keeps data in the
      // registry so save/load roundtrips across opens behave like IDB.
    },
  });

  const stub = {
    open: (name: string, version: number): StubIdbRequest<StubIdbDatabase> => {
      openCalls.push({ name, version });
      const req = makeRequest<StubIdbDatabase>();
      setTimeout(() => {
        if (options.failOpen) {
          req.error = new Error(`stub open failed for ${name}`);
          fire(req.onerror);
          return;
        }
        const existing = registry.get(name);
        const isNew = existing === undefined;
        const stores: Map<string, Map<string, Record<string, unknown>>> =
          existing ?? new Map();
        if (isNew) registry.set(name, stores);
        req.result = makeDatabase(stores);
        if (isNew) fire(req.onupgradeneeded);
        fire(req.onsuccess);
      }, 0);
      return req;
    },
  };

  globalScope.indexedDB = stub;

  return {
    peekEntry: (key) =>
      registry.get(DB_NAME)?.get(STORE_NAME)?.get(key),
    openCalls,
  };
}

describe("plannerLocalBackup", () => {
  let stub: StubHandle;

  beforeEach(() => {
    stub = installStubIndexedDB();
  });

  afterEach(() => {
    if (originalIndexedDB === undefined) {
      delete globalScope.indexedDB;
    } else {
      globalScope.indexedDB = originalIndexedDB;
    }
  });

  it("saves and loads an entry with the documented shape", async () => {
    const canvasJson = { objects: [{ id: "a", x: 10 }], zoom: 1 };
    const sheet = { widthMm: 4000, heightMm: 3000 };
    const before = Date.now();
    await saveLocalBackup("p-1", canvasJson, sheet);
    const entry = await loadLocalBackup("p-1");
    const after = Date.now();

    expect(entry).not.toBeNull();
    expect(Object.keys(entry ?? {}).sort()).toEqual([
      "canvasJson",
      "projectId",
      "savedAt",
      "sheet",
    ]);
    expect(entry?.projectId).toBe("p-1");
    expect(entry?.canvasJson).toEqual(canvasJson);
    expect(entry?.sheet).toEqual(sheet);
    expect(typeof entry?.savedAt).toBe("number");
    expect(entry?.savedAt).toBeGreaterThanOrEqual(before);
    expect(entry?.savedAt).toBeLessThanOrEqual(after);
    expect(stub.openCalls[0]).toEqual({ name: DB_NAME, version: 1 });
  });

  it("uses the __draft__ sentinel key when projectId is null", async () => {
    await saveLocalBackup(null, { draft: true }, { widthMm: 100 });

    expect(stub.peekEntry("__draft__")).toMatchObject({
      projectId: "__draft__",
      canvasJson: { draft: true },
    });
    const viaNull = await loadLocalBackup(null);
    const viaSentinel = await loadLocalBackup("__draft__");
    expect(viaNull).not.toBeNull();
    expect(viaSentinel).toEqual(viaNull);
    // The draft backup is invisible under a real project id.
    expect(await loadLocalBackup("p-1")).toBeNull();
  });

  it("returns null when loading a missing projectId", async () => {
    expect(await loadLocalBackup("never-saved")).toBeNull();
  });

  it("clearLocalBackup removes only the targeted entry", async () => {
    await saveLocalBackup("p-keep", { kept: true }, null);
    await saveLocalBackup("p-drop", { dropped: true }, null);

    await clearLocalBackup("p-drop");

    expect(stub.peekEntry("p-drop")).toBeUndefined();
    expect(await loadLocalBackup("p-drop")).toBeNull();
    expect(await loadLocalBackup("p-keep")).toMatchObject({
      projectId: "p-keep",
    });
  });

  it("clearLocalBackup(null) removes the draft entry", async () => {
    await saveLocalBackup(null, { draft: true }, null);
    await clearLocalBackup(null);
    expect(stub.peekEntry("__draft__")).toBeUndefined();
    expect(await loadLocalBackup(null)).toBeNull();
  });

  it("save never rejects and load returns null when IndexedDB open fails", async () => {
    stub = installStubIndexedDB({ failOpen: true });

    await expect(
      saveLocalBackup("p-1", { canvas: 1 }, { sheet: 1 }),
    ).resolves.toBeUndefined();
    await expect(loadLocalBackup("p-1")).resolves.toBeNull();
    await expect(clearLocalBackup("p-1")).resolves.toBeUndefined();
  });

  it("load returns null and save resolves when IndexedDB is unavailable", async () => {
    delete globalScope.indexedDB;

    await expect(loadLocalBackup("p-1")).resolves.toBeNull();
    await expect(
      saveLocalBackup("p-1", { canvas: 1 }, { sheet: 1 }),
    ).resolves.toBeUndefined();
    await expect(clearLocalBackup("p-1")).resolves.toBeUndefined();
  });
});
