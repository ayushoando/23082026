"use client";

/**
 * Local IndexedDB backup for the Planner canvas.
 *
 * A lightweight safety net that periodically snapshots the in-memory canvas
 * so work is not lost on an abrupt close, network failure, or sign-out.
 *
 * Design decisions:
 * - No external dependency — uses the native IndexedDB API directly.
 * - One object store keyed by projectId (or the sentinel "__draft__").
 * - Backup is only read on load when the server copy is absent or older.
 * - Never throws: errors are swallowed so backup failures never break the UI.
 */

const DB_NAME = "ooplanner-backup";
const DB_VERSION = 1;
const STORE_NAME = "canvas";

export interface PlannerLocalBackupEntry {
  projectId: string;
  canvasJson: unknown;
  sheet: unknown;
  savedAt: number;
}

function openBackupDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Write a backup entry for the given project. Fire-and-forget safe. */
export async function saveLocalBackup(
  projectId: string | null,
  canvasJson: unknown,
  sheet: unknown,
): Promise<void> {
  try {
    const db = await openBackupDb();
    const entry: PlannerLocalBackupEntry = {
      projectId: projectId ?? "__draft__",
      canvasJson,
      sheet,
      savedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Never let backup errors surface.
  }
}

/** Read the backup entry for a project id. Returns null if not found. */
export async function loadLocalBackup(
  projectId: string | null,
): Promise<PlannerLocalBackupEntry | null> {
  try {
    const db = await openBackupDb();
    const key = projectId ?? "__draft__";
    const entry = await new Promise<PlannerLocalBackupEntry | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key) as IDBRequest<PlannerLocalBackupEntry | undefined>;
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return entry;
  } catch {
    return null;
  }
}

/** Delete the backup for a project once it has been successfully saved to the server. */
export async function clearLocalBackup(projectId: string | null): Promise<void> {
  try {
    const db = await openBackupDb();
    const key = projectId ?? "__draft__";
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}
