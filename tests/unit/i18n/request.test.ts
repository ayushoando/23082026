// @vitest-environment node
/**
 * Name-mirror: i18n/request.ts
 * Static English default — no next/headers (COST-S02).
 */
import { describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type RequestConfigResult = {
  locale: string;
  messages: Record<string, unknown>;
};

type RequestConfigFactory = () => Promise<RequestConfigResult>;

let capturedFactory: RequestConfigFactory | undefined;

vi.mock("next-intl/server", () => ({
  getRequestConfig: (factory: RequestConfigFactory) => {
    capturedFactory = factory;
    return factory;
  },
}));

async function loadRequestFactory(): Promise<RequestConfigFactory> {
  capturedFactory = undefined;
  vi.resetModules();
  const mod = await import("@/i18n/request");
  const exported = mod.default as RequestConfigFactory;
  expect(typeof exported).toBe("function");
  if (capturedFactory === undefined) {
    throw new Error("getRequestConfig did not capture factory");
  }
  return capturedFactory;
}

describe("i18n/request.ts", () => {
  it("always returns the default English locale and en messages", async () => {
    const factory = await loadRequestFactory();
    const result = await factory();

    expect(result.locale).toBe(defaultLocale);
    expect(result.locale).toBe("en");
    expect(result.messages).toBeDefined();
    expect(typeof result.messages).toBe("object");
    expect(Object.keys(result.messages).length).toBeGreaterThan(0);
  });

  it("does not import next/headers", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../site/i18n/request.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/from ["']next\/headers["']/);
  });
});
