// @vitest-environment node
import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 12.1 — VERCEL_ORIGIN single source of truth.
 *
 * The origin value must exist exactly once: wrangler.toml [vars]. The worker
 * source must NOT carry a hardcoded fallback (a Vercel project rename would
 * otherwise silently break production while wrangler.toml was updated).
 */
const WORKER_DIR = fileURLToPath(
  new URL("../../../workers/oando-worker-proxy/", import.meta.url),
);

const workerSource = readFileSync(`${WORKER_DIR}src/index.js`, "utf8");
const wranglerToml = readFileSync(`${WORKER_DIR}wrangler.toml`, "utf8");

function makeRequest(pathname: string): Request {
  return new Request(`https://oando.co.in${pathname}`, { method: "GET" });
}

const worker = (await import("../../../workers/oando-worker-proxy/src/index.js"))
  .default as { fetch(req: Request, env: unknown): Promise<Response> };

describe("12.1 worker origin single source of truth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps wrangler.toml [vars] as the only place the origin literal exists", () => {
    expect(wranglerToml).toMatch(/\[vars\]/);
    expect(wranglerToml).toContain('VERCEL_ORIGIN = "https://oando1408.vercel.app"');
    // The literal must not appear in worker source (no code fallback).
    expect(workerSource).not.toContain("oando1408.vercel.app");
    // The env dependency itself stays (operations-review extractor requires it).
    expect(workerSource).toContain("env.VERCEL_ORIGIN");
  });

  it("fails fast with a 500 when VERCEL_ORIGIN is not configured", async () => {
    const response = await worker.fetch(makeRequest("/about"), {});
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("VERCEL_ORIGIN is not configured");
    expect(response.headers.get("x-oando-proxy")).toBe("config-error");
    expect(response.headers.get("strict-transport-security")).toBeTruthy();
  });

  it("rejects protocol-relative paths before selecting an upstream origin", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await worker.fetch(makeRequest("//evil.example/steal"), {
      VERCEL_ORIGIN: "https://origin.example",
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("x-oando-proxy")).toBe("invalid-path");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds the upstream URL from env.VERCEL_ORIGIN when configured", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("ok", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await worker.fetch(makeRequest("/about"), {
      VERCEL_ORIGIN: "https://origin.example",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-oando-proxy")).toBe("cloudflare-worker");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [upstream, options] = fetchMock.mock.calls[0] ?? [];
    if (!(upstream instanceof Request)) {
      throw new Error("Expected the worker to send a Request upstream");
    }
    expect(upstream.url).toBe("https://origin.example/about");
    expect(options).toMatchObject({
      redirect: "manual",
      cf: { cacheEverything: false },
    });
  });
});
