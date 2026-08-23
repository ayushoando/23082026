// @vitest-environment node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  mergeMarketingIntoEn,
  syncMarketingI18nMessages,
} from "../../../scripts/sync-marketing-i18n-messages.mjs";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("sync-marketing-i18n-messages (name-mirror)", () => {
  it("mergeMarketingIntoEn merges marketing copy while preserving home namespace depth", () => {
    const en = {
      common: { ok: "OK" },
      home: { hero: { title: "Original Home" }, existing: "value" },
    };
    const marketing = {
      about: { title: "About Us" },
      home: { hero: { title: "Updated Home" }, newSection: "fresh" },
    };

    const merged = mergeMarketingIntoEn(en, marketing);
    expect(merged).toEqual({
      common: { ok: "OK" },
      about: { title: "About Us" },
      home: {
        hero: { title: "Updated Home" },
        existing: "value",
        newSection: "fresh",
      },
    });
  });

  it("syncMarketingI18nMessages with write=false performs dry run merge", () => {
    const enPath = path.join(siteRoot, "site/i18n/messages/en.json");
    const sampleMarketing = {
      about: { headline: "About Oando" },
    };

    const { merged, marketingKeys } = syncMarketingI18nMessages({
      enPath,
      marketing: sampleMarketing,
      write: false,
    });

    expect(marketingKeys).toEqual(["about"]);
    expect(merged.about).toEqual({ headline: "About Oando" });
  });
});
