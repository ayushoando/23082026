import { describe, expect, it } from "vitest";

import { shouldUnoptimizeImages } from "@/lib/images/optimizerMode";

describe("shouldUnoptimizeImages", () => {
  it("turns the optimizer off in production", () => {
    expect(shouldUnoptimizeImages({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("lets NEXT_IMAGE_UNOPTIMIZED=0 force the optimizer on in production", () => {
    expect(
      shouldUnoptimizeImages({
        VERCEL_ENV: "production",
        NEXT_IMAGE_UNOPTIMIZED: "0",
      }),
    ).toBe(false);
  });

  it("lets NEXT_IMAGE_UNOPTIMIZED=false force the optimizer on", () => {
    expect(
      shouldUnoptimizeImages({
        VERCEL_ENV: "production",
        NEXT_IMAGE_UNOPTIMIZED: "false",
      }),
    ).toBe(false);
  });

  it("leaves the optimizer on in non-production unless opted out", () => {
    expect(shouldUnoptimizeImages({})).toBe(false);
    expect(shouldUnoptimizeImages({ VERCEL_ENV: "preview" })).toBe(false);
  });

  it("opts out of the optimizer in non-production when NEXT_IMAGE_UNOPTIMIZED=1", () => {
    expect(shouldUnoptimizeImages({ NEXT_IMAGE_UNOPTIMIZED: "1" })).toBe(true);
    expect(shouldUnoptimizeImages({ NEXT_IMAGE_UNOPTIMIZED: "true" })).toBe(
      true,
    );
  });
});
