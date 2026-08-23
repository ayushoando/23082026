import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

/**
 * Runtime disk writes are legal only in local disk mode (DEV_AUTH_BYPASS=1
 * and not production). Production FS is read-only — throw EROFS.
 */
export function assertDevDiskWritable(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (isDevAuthBypassEnabled(env)) {
    return;
  }
  const err = new Error(
    "Disk writes are disabled outside DEV_AUTH_BYPASS local mode (production FS is read-only)",
  );
  (err as NodeJS.ErrnoException).code = "EROFS";
  throw err;
}
