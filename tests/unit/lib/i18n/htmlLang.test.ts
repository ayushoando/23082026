/**
 * htmlLang must match LOCALE_HREFLANG (seo.ts). Locales: en + hi only.
 */
import { describe, expect, it } from "vitest";
import { getHtmlLang } from "@/lib/i18n/htmlLang";
import { LOCALE_HREFLANG } from "@/features/site/data/seo";

describe("getHtmlLang", () => {
  it("maps product locales to BCP 47 regional tags (aligned with hreflang)", () => {
    expect(getHtmlLang("en")).toBe("en-IN");
    expect(getHtmlLang("hi")).toBe("hi-IN");
  });

  it("matches LOCALE_HREFLANG as independent source of truth", () => {
    expect(getHtmlLang("en")).toBe(LOCALE_HREFLANG.en);
    expect(getHtmlLang("hi")).toBe(LOCALE_HREFLANG.hi);
  });

  it("defaults to en-IN for unknown or missing locale", () => {
    expect(getHtmlLang()).toBe("en-IN");
    expect(getHtmlLang("zz")).toBe("en-IN");
    expect(getHtmlLang("en-US")).toBe("en-IN");
  });
});
