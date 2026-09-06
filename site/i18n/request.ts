import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./config";

/**
 * Locale determined by requestLocale (URL prefix via proxy/routing).
 * Does not import next/headers or read cookies so static HTML caching remains intact (COST-S02).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const reqLocale = await requestLocale;
  const locale = isLocale(reqLocale) ? reqLocale : defaultLocale;
  const messages = locale === "hi"
    ? (await import("./messages/hi.json")).default
    : (await import("./messages/en.json")).default;

  return {
    locale,
    messages,
  };
});
