import { getLocale } from "next-intl/server";
import hiMessages from "@/i18n/messages/hi.json";

/**
 * Keep English route copy as the full shape, overlay Hindi keys that exist
 * in messages/hi.json for the given namespace.
 */
export async function withLocaleCopy<T extends Record<string, unknown>>(
  english: T,
  namespace: string,
): Promise<T> {
  const locale = await getLocale();
  if (locale !== "hi") {
    return english;
  }
  const patch = (hiMessages as Record<string, unknown>)[namespace];
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return english;
  }
  return { ...english, ...(patch as Record<string, unknown>) } as T;
}
