// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sanitizeIndexNowUrls, submitToIndexNow } from "@/lib/seo/indexnow";

describe("IndexNow Protocol Client", () => {
  it("sanitizeIndexNowUrls normalizes relative and apex URLs and enforces trailing slashes", () => {
    const raw = [
      "/products/workstations",
      "https://oando.co.in/products/seating/apex-chair",
      "https://evil.com/phish",
      "not a url",
      "https://oando.co.in/about/",
    ];

    const cleaned = sanitizeIndexNowUrls(raw, "oando.co.in");
    expect(cleaned).toEqual([
      "https://oando.co.in/products/workstations/",
      "https://oando.co.in/products/seating/apex-chair/",
      "https://oando.co.in/about/",
    ]);
  });

  it("submitToIndexNow handles dryRun mode correctly without network calls", async () => {
    const result = await submitToIndexNow(["/products/workstations/"], { dryRun: true });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.submittedCount).toBe(1);
    expect(result.message).toContain("[Dry Run]");
  });

  it("submitToIndexNow rejects empty or invalid URL lists", async () => {
    const result = await submitToIndexNow([]);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.submittedCount).toBe(0);
  });
});
