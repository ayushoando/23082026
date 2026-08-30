import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { TrustedByPageView } from "@/components/trusted-by/TrustedByPageView";
import { TRUSTED_BY_CLIENTS } from "@/features/site/data/proof";
import { TRUSTED_BY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadTrustedByCopy() {
  return withLocaleCopy(
    { ...TRUSTED_BY_PAGE_COPY, deliveryQuotesLabel: "Delivery quotes" },
    "trustedBy",
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadTrustedByCopy();
  return buildPageMetadata(SITE_URL, {
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    path: "/trusted-by",
  });
}

/** Client proof page — roster, stats, quotes. Photos stay on /clients. */
export default async function TrustedByPage() {
  const copy = await loadTrustedByCopy();
  const sectors = Array.from(new Set(TRUSTED_BY_CLIENTS.map((client) => client.sector)));

  const trustedByJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/trusted-by",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: copy.heroTitle, path: "/trusted-by" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(trustedByJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <TrustedByPageView
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        overviewKicker={copy.overviewKicker}
        overviewTitle={copy.overviewTitle}
        overviewDescription={copy.overviewDescription}
        statsKicker={copy.statsKicker}
        clients={TRUSTED_BY_CLIENTS}
        rosterKicker={copy.rosterKicker}
        quotesKicker={copy.quotesKicker}
        quotesTitle={copy.quotesTitle}
        quotes={copy.quotes}
        sectors={sectors}
        sectorsKicker={copy.sectorsKicker}
        sectorsTitle={copy.sectorsTitle}
        sectorsDescription={copy.sectorsDescription}
        ctaKicker={copy.ctaKicker}
        ctaTitleLead={copy.ctaTitleLead}
        ctaTitleAccent={copy.ctaTitleAccent}
        ctaDescription={copy.ctaDescription}
        ctaPrimary={copy.ctaPrimary}
        ctaSecondary={copy.ctaSecondary}
        deliveryQuotesLabel={copy.deliveryQuotesLabel}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
