import { describe, expect, it } from "vitest";
import { MAX_MULTIPART_UPLOAD_BYTES, isOversizedUpload } from "@/lib/security/uploadLimits";

describe("uploadLimits", () => {
  it("rejects files over 10 MiB", () => {
    const file = { size: MAX_MULTIPART_UPLOAD_BYTES + 1 } as File;
    expect(isOversizedUpload(file)).toBe(true);
  });

  it("accepts files at or under the limit", () => {
    const file = { size: MAX_MULTIPART_UPLOAD_BYTES } as File;
    expect(isOversizedUpload(file)).toBe(false);
  });
});
