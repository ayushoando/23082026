import { getLocale } from "next-intl/server";
import hiMessages from "@/i18n/messages/hi.json";

type MessageRecord = Record<string, unknown>;

function isMessageRecord(value: unknown): value is MessageRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessageRecords(base: MessageRecord, patch: MessageRecord): MessageRecord {
  const merged: MessageRecord = { ...base };

  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = merged[key];
    merged[key] =
      isMessageRecord(baseValue) && isMessageRecord(patchValue)
        ? mergeMessageRecords(baseValue, patchValue)
        : patchValue;
  }

  return merged;
}

function localePatch(namespace: string): MessageRecord {
  const messages = hiMessages as MessageRecord;
  const directPatch = messages[namespace];
  const marketing = messages.marketing;
  const marketingPatch = isMessageRecord(marketing) ? marketing[namespace] : undefined;

  return mergeMessageRecords(
    isMessageRecord(directPatch) ? directPatch : {},
    isMessageRecord(marketingPatch) ? marketingPatch : {},
  );
}

/**
 * Retain English copy as a typed fallback while applying the complete Hindi
 * message patch for a public-marketing namespace. Nested records are merged
 * recursively and arrays are replaced, so translated lists remain atomic.
 */
export async function withLocaleCopy<T extends MessageRecord>(
  english: T,
  namespace: string,
): Promise<T> {
  const locale = await getLocale();
  if (locale !== "hi") {
    return english;
  }

  return mergeMessageRecords(english, localePatch(namespace)) as T;
}
