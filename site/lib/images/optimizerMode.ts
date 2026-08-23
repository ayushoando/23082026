/**
 * Whether next/image should skip `/_next/image` (R2 webp already compressed).
 * Production is unoptimized. Escape hatch: NEXT_IMAGE_UNOPTIMIZED=0.
 */
export function shouldUnoptimizeImages(
  env: {
    NEXT_IMAGE_UNOPTIMIZED?: string | undefined;
    VERCEL_ENV?: string | undefined;
  },
): boolean {
  const flag = env.NEXT_IMAGE_UNOPTIMIZED?.trim().toLowerCase();
  if (flag === "0" || flag === "false") {
    return false;
  }
  if (env.VERCEL_ENV === "production") {
    return true;
  }
  return flag === "1" || flag === "true";
}
