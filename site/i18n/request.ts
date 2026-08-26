import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

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
