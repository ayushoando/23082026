import { describe, expect, it } from "vitest";
import {
  MAX_MULTIPART_UPLOAD_BYTES,
  isOversizedRequestBody,
  isOversizedUpload,
} from "@/lib/security/uploadLimits";

const headersWith = (contentLength: string | null): Headers => {
  const headers = new Headers();
  if (contentLength !== null) headers.set("content-length", contentLength);
  return headers;
};

describe("uploadLimits", () => {
  it("rejects files over 10 MiB", () => {
    const file = { size: MAX_MULTIPART_UPLOAD_BYTES + 1 } as File;
    expect(isOversizedUpload(file)).toBe(true);
  });

  it("accepts files at or under the limit", () => {
    const file = { size: MAX_MULTIPART_UPLOAD_BYTES } as File;
    expect(isOversizedUpload(file)).toBe(false);
  });

  describe("isOversizedRequestBody (SEC-R09 content-length pre-check)", () => {
    it("rejects a declared body beyond the multipart budget", () => {
      expect(
        isOversizedRequestBody(
          headersWith(String(11 * 1024 * 1024)),
        ),
      ).toBe(true);
    });

    it("accepts a limit-sized body within the multipart overhead margin", () => {
      expect(
        isOversizedRequestBody(
          headersWith(String(MAX_MULTIPART_UPLOAD_BYTES + 1024)),
        ),
      ).toBe(false);
    });

    it("passes when Content-Length is absent (chunked bodies)", () => {
      expect(isOversizedRequestBody(headersWith(null))).toBe(false);
    });

    it("passes on unparsable or negative Content-Length", () => {
      expect(isOversizedRequestBody(headersWith("not-a-number"))).toBe(false);
      expect(isOversizedRequestBody(headersWith("-1"))).toBe(false);
    });

    it("honours a custom budget", () => {
      const small = 1024;
      expect(isOversizedRequestBody(headersWith("999999"), small)).toBe(true);
      expect(isOversizedRequestBody(headersWith("1025"), small)).toBe(false);
    });
  });
});
