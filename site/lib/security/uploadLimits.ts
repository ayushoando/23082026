/** Maximum bytes accepted for multipart catalog/furniture uploads (10 MiB). */
export const MAX_MULTIPART_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isOversizedUpload(file: File): boolean {
  return file.size > MAX_MULTIPART_UPLOAD_BYTES;
}
