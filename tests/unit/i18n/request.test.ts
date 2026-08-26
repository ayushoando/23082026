// @vitest-environment node
/**
 * Name-mirror: i18n/request.ts
 * Locale from NEXT_LOCALE cookie (en default, hi when set).
 */
import { describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";

type RequestConfigResult = {
  locale: string;
  messages: Record<string, unknown>;
};

type RequestConfigFactory = () => Promise<RequestConfigResult>;

let capturedFactory: RequestConfigFactory | undefined;
const cookieGet = vi.fn();

vi.mock("next-intl/server", () => ({
  getRequestConfig: (factory: RequestConfigFactory) => {
    capturedFactory = factory;
    return factory;
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: cookieGet,
  }),
}));

async function loadRequestFactory(): Promise<RequestConfigFactory> {
  capturedFactory = undefined;
  vi.resetModules();
  cookieGet.mockReset();
  const mod = await import("@/i18n/request");
  const exported = mod.default as RequestConfigFactory;
  expect(typeof exported).toBe("function");
  if (capturedFactory === undefined) {
    throw new Error("getRequestConfig did not capture factory");
  }
  return capturedFactory;
}

describe("i18n/request.ts", () => {
  it("defaults to English when NEXT_LOCALE is absent", async () => {
    const factory = await loadRequestFactory();
    cookieGet.mockReturnValue(undefined);
    const result = await factory();

    expect(result.locale).toBe(defaultLocale);
    expect(result.locale).toBe("en");
    expect(result.messages.about).toBeDefined();
  });

  it("loads Hindi messages when NEXT_LOCALE=hi", async () => {
    const factory = await loadRequestFactory();
    cookieGet.mockReturnValue({ value: "hi" });
    const result = await factory();

    expect(result.locale).toBe("hi");
    const about = result.messages.about as { heroTitleLead?: string };
    expect(about.heroTitleLead).toBe("कुशलता से तैयार");
  });

  it("falls back to English for an unknown cookie value", async () => {
    const factory = await loadRequestFactory();
    cookieGet.mockReturnValue({ value: "fr" });
    const result = await factory();

    expect(result.locale).toBe("en");
  });
});
