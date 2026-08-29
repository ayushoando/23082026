import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, type Locale } from "./config";

async function loadMessages(locale: Locale) {
  if (locale === "hi") {
    return (await import("./messages/hi.json")).default;
  }
  return (await import("./messages/en.json")).default;
}

/**
 * Locale comes from the NEXT_LOCALE cookie set by LanguageSwitcher.
 * Prefixless URLs (`localePrefix: never`) share one path per page.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get("NEXT_LOCALE")?.value;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const messages = await loadMessages(locale);
  return {
    locale,
    messages,
  };
});
