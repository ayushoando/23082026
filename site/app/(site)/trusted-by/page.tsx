import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { TrustedByPageView } from "@/components/trusted-by/TrustedByPageView";
import { TRUSTED_BY_CLIENTS } from "@/features/site/data/proof";
import { getBusinessStats } from "@/features/crm/businessStats";
import { KpiIntegrityMonitor } from "@/components/analytics/KpiIntegrityMonitor";
import { TRUSTED_BY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { TRUSTED_BY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadTrustedByCopy() {
  return withLocaleCopy(
    { ...TRUSTED_BY_PAGE_COPY, deliveryQuotesLabel: "Delivery quotes" },
    "trustedBy",
  );
}

export const metadata: Metadata = TRUSTED_BY_PAGE_METADATA;

/** Client proof page — roster, stats, quotes. Photos stay on /clients. */
export default async function TrustedByPage() {
  const [copy, { stats, source }, nonce] = await Promise.all([
    loadTrustedByCopy(),
    getBusinessStats(),
    getRequestNonce(),
  ]);
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
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(trustedByJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <KpiIntegrityMonitor page="trusted-by" source={source} stats={stats} />
      <TrustedByPageView
        businessStats={stats}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        overviewKicker={copy.overviewKicker}
        overviewTitle={copy.overviewTitle}
        overviewDescription={copy.overviewDescription}
        statsKicker={copy.statsKicker}
        craftQuote={copy.craftQuote}
        craftAttribution={copy.craftAttribution}
        clients={TRUSTED_BY_CLIENTS}
        rosterKicker={copy.rosterKicker}
        rosterTitle={copy.rosterTitle}
        rosterDescription={copy.rosterDescription}
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
      <div className="hidden" aria-hidden="true">
        <ContactTeaser />
      </div>
    </HomeMarketingLayout>
  );
}
