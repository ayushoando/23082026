/** Maximum bytes accepted for multipart catalog/furniture uploads (10 MiB). */
export const MAX_MULTIPART_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isOversizedUpload(file: File): boolean {
  return file.size > MAX_MULTIPART_UPLOAD_BYTES;
}

/**
 * SEC-R09: reject bodies whose declared Content-Length already exceeds the
 * upload budget before `formData()` materializes them in memory. The margin
 * covers multipart boundaries and text fields so legitimate limit-sized
 * files still pass. Returns false when the header is absent or unparsable —
 * the post-parse `isOversizedUpload` check remains the backstop.
 */
const CONTENT_LENGTH_MARGIN_BYTES = 64 * 1024;

export function isOversizedRequestBody(
  headers: Headers,
  limitBytes: number = MAX_MULTIPART_UPLOAD_BYTES,
): boolean {
  const raw = headers.get("content-length");
  if (!raw) return false;
  const length = Number(raw);
  if (!Number.isFinite(length) || length < 0) return false;
  return length > limitBytes + CONTENT_LENGTH_MARGIN_BYTES;
}
