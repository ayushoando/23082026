// @vitest-environment node
/**
 * Name-mirror: i18n/request.ts
 * COST-S02 — English-only static locale. No cookies / next/headers.
 */
import { describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import hiMessages from "@/i18n/messages/hi.json";

type RequestConfigResult = {
  locale: string;
  messages: Record<string, unknown>;
};

type RequestConfigFactory = (params?: { requestLocale?: Promise<string | undefined> }) => Promise<RequestConfigResult>;

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
  it("defaults to English with en.json messages (COST-S02)", async () => {
    const factory = await loadRequestFactory();
    const result = await factory({ requestLocale: Promise.resolve(undefined) });

    expect(result.locale).toBe(defaultLocale);
    expect(result.locale).toBe("en");
    expect(result.messages).toEqual(enMessages);
    expect(result.messages.about).toBeDefined();
  });

  it("returns Hindi with hi.json messages when requestLocale is 'hi'", async () => {
    const factory = await loadRequestFactory();
    const result = await factory({ requestLocale: Promise.resolve("hi") });

    expect(result.locale).toBe("hi");
    expect(result.messages).toEqual(hiMessages);
    expect(result.messages.about).toBeDefined();
  });
});
