import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

/**
 * Static default locale so marketing HTML can be cached (COST-S02).
 * Do not import next/headers — dynamic request APIs force private, no-store.
 */
export default getRequestConfig(async () => {
  const messages = (await import("./messages/en.json")).default;
  return {
    locale: defaultLocale,
    messages,
  };
});
