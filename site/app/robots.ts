import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  const sitemapHost = BASE_URL.replace(/\/+$/, "");
  // Explicit major crawlers (same rules) — helps Bing/Google discover allow/disallow cleanly.
  const crawlers = ["*", "Googlebot", "Bingbot", "Googlebot-Image"] as const;

  return {
    rules: crawlers.map((userAgent) => ({
      userAgent,
      allow: "/",
    })),
    // No `host` emission: it is a Yandex-only, non-standard hint. Google and
    // Bing discover the origin from the sitemap URL below.
    sitemap: [`${sitemapHost}/sitemap.xml`],
  };
}