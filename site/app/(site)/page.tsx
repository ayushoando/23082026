import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
/* Homepage CSS loaded once via site/index.css → homepage/index.css (globals). */
import { HomepageHero } from "@/components/home/HomepageHero";
import { HomeDeferredSections } from "@/components/home/HomeDeferredSections";
import { HomeMarketingLayout } from "@/components/home/layout";
import { Collections } from "@/components/home/Collections";

import { SITE_BRAND } from "@/features/site/data/brand";
import { buildPageJsonLd, buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: SITE_BRAND.defaultTitle,
  description: SITE_BRAND.description,
  path: "/",
  keywords: [...SITE_BRAND.brandKeywords],
});

export default async function Home() {
  const [t, nonce] = await Promise.all([
    getTranslations("home"),
    getRequestNonce(),
  ]);
  // Organization / FurnitureStore live in (site)/layout sitewide graph — home only adds WebPage.
  const homeJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/",
    title: SITE_BRAND.defaultTitle,
    description: SITE_BRAND.description,
    pageType: "WebPage",
  });

  const sectionLabel = t("showcase.sectionLabel");
  const sectionTitleLead = t("showcase.sectionTitleLead");
  const sectionTitleAccent = t("showcase.sectionTitleAccent");
  const showcaseItems = t.raw("showcase.items") as Array<{
    id: string;
    name: string;
    label: string;
    image: string;
    link: string;
  }>;

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(homeJsonLd) }}
      />

      <HomepageHero />
      <Collections />
      <HomeDeferredSections
        showcase={{
          sectionLabel,
          sectionAriaLabel: `${sectionTitleLead} ${sectionTitleAccent}`,
          sectionTitle: (
            <>
              {sectionTitleLead}{" "}
              <span className="text-accent-italic">{sectionTitleAccent}</span>
            </>
          ),
          items: [...showcaseItems],
          browseLink: t("showcase.browseCta.href"),
          browseLabel: t("showcase.browseCta.label"),
        }}
      />
    </HomeMarketingLayout>
  );
}
