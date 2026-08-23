import { headers } from "next/headers";

/** CSP nonce forwarded by `site/proxy.ts` (`x-nonce`). */
export async function getRequestNonce(): Promise<string | undefined> {
  try {
    return (await headers()).get("x-nonce") ?? undefined;
  } catch {
    return undefined;
  }
}
