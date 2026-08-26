import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getLocale: async () => "hi",
}));

import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";

describe("withLocaleCopy", () => {
  it("overlays Hindi trustedBy keys onto English copy", async () => {
    const copy = await withLocaleCopy(
      { heroTitleLead: "Trusted", heroTitleAccent: "by", extra: "keep" },
      "trustedBy",
    );
    expect(copy.heroTitleLead).toBe("विश्वसनीय");
    expect(copy.extra).toBe("keep");
  });
});
