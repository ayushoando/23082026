// @vitest-environment node
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defaultLocale, locales } from "@/i18n/config";
import { routing } from "@/i18n/routing";

describe("i18n config", () => {
  it("registers English and Hindi only, English default", () => {
    expect(locales).toEqual(["en", "hi"]);
    expect(defaultLocale).toBe("en");
    expect(routing.locales).toEqual([...locales]);
    expect(routing.defaultLocale).toBe("en");
  });

  it.each(locales)("ships message bundle for %s", (locale) => {
    const messagePath = resolve(process.cwd(), "i18n/messages", `${locale}.json`);
    expect(existsSync(messagePath)).toBe(true);
  });
});
