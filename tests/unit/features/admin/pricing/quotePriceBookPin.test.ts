import { describe, expect, it } from "vitest";

import type { PriceBookContract } from "@/features/admin/pricing/priceBookContract";
import {
  computePinnedQuoteBreakdown,
  pinQuoteAtBookVersion,
  pinQuotePriceBook,
  quoteStillValidAgainstBook,
  reproduciblePinnedTotal,
} from "@/features/admin/pricing/quotePriceBookPin";
import { PLANNER_FURNITURE_BOQ_GST_RATE } from "@/lib/Planner/boq/types";

const BOOK: PriceBookContract = {
  type: "oando-price-book",
  schemaVersion: 1,
  familySlug: "linear-desk-1200",
  bookId: "pb-linear-2026-q3",
  activeVersionId: "v1",
  versions: [
    {
      versionId: "v1",
      effectiveFrom: "2026-07-01",
      currency: "INR",
      status: "active",
      rules: [
        {
          sku: "OFL-DSK-LIN-1200",
          unitPriceMinor: 100_00,
          currency: "INR",
          uom: "each",
        },
      ],
    },
    {
      versionId: "v0",
      effectiveFrom: "2026-01-01",
      currency: "INR",
      status: "rolled_back",
      rules: [
        {
          sku: "OFL-DSK-LIN-1200",
          unitPriceMinor: 80_00,
          currency: "INR",
          uom: "each",
        },
      ],
    },
  ],
};

describe("quotePriceBookPin", () => {
  it("pins quoteId + bookId + versionId and keeps totals on the pinned version", () => {
    const pin = pinQuotePriceBook("q-1", BOOK, "v1");
    expect(pin).toMatchObject({
      quoteId: "q-1",
      bookId: "pb-linear-2026-q3",
      versionId: "v1",
    });
    const breakdown = computePinnedQuoteBreakdown(pin, BOOK, [
      { sku: "OFL-DSK-LIN-1200", quantity: 2 },
    ]);
    expect(breakdown.totalMinor).toBe(200_00);
    expect(quoteStillValidAgainstBook(pin, BOOK)).toBe(true);
  });

  it("fails closed when the requested version is not pin-able", () => {
    const result = pinQuoteAtBookVersion("q-1", BOOK, "v0");
    expect(result).toEqual({
      ok: false,
      error: 'Version "v0" is not pin-able (status rolled_back)',
    });
  });

  it("keeps pinned totals after the active book advances", () => {
    const pin = pinQuotePriceBook("q-1", BOOK, "v1");
    const advanced: PriceBookContract = {
      ...BOOK,
      activeVersionId: "v2",
      versions: [
        {
          versionId: "v2",
          effectiveFrom: "2026-10-01",
          currency: "INR",
          status: "active",
          rules: [
            {
              sku: "OFL-DSK-LIN-1200",
              unitPriceMinor: 150_00,
              currency: "INR",
              uom: "each",
            },
          ],
        },
        ...BOOK.versions,
      ],
    };
    expect(reproduciblePinnedTotal(pin, BOOK, advanced, [{ sku: "OFL-DSK-LIN-1200", quantity: 2 }])).toBe(
      true,
    );
  });

  it("does not invent GST on the price book — GST is planner BOQ 18%", () => {
    expect(PLANNER_FURNITURE_BOQ_GST_RATE).toBe(0.18);
  });
});
