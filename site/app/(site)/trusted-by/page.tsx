import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { TrustedByPageView } from "@/components/trusted-by/TrustedByPageView";
import { TRUSTED_BY_CLIENTS } from "@/features/site/data/proof";
import { TRUSTED_BY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { TRUSTED_BY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = TRUSTED_BY_PAGE_METADATA;

/**
 * Client proof page — roster, stats, quotes. Photos stay on /clients.
 */
export default function TrustedByPage() {
  const sectors = Array.from(new Set(TRUSTED_BY_CLIENTS.map((client) => client.sector)));

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/be88d5c5-6cda-4fd6-945a-b8e1c64da733", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6bcf28" }, body: JSON.stringify({ sessionId: "6bcf28", runId: "initial", hypothesisId: "H1,H2,H3", location: "site/app/(site)/trusted-by/page.tsx:18", message: "TrustedByPage runtime entry", data: { clientCount: TRUSTED_BY_CLIENTS.length, sectorCount: sectors.length, rosterKickerType: typeof TRUSTED_BY_PAGE_COPY.rosterKicker }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion

  const trustedByJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/trusted-by",
    title: `${TRUSTED_BY_PAGE_COPY.heroTitle} | One&Only`,
    description: TRUSTED_BY_PAGE_COPY.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Trusted by", path: "/trusted-by" },
  ]);

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/be88d5c5-6cda-4fd6-945a-b8e1c64da733", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6bcf28" }, body: JSON.stringify({ sessionId: "6bcf28", runId: "initial", hypothesisId: "H1,H2", location: "site/app/(site)/trusted-by/page.tsx:34", message: "TrustedByPage props prepared", data: { hasRosterKicker: Boolean(TRUSTED_BY_PAGE_COPY.rosterKicker), hasSectors: sectors.length > 0, quoteCount: TRUSTED_BY_PAGE_COPY.quotes.length }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion

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
        heroTitleLead={TRUSTED_BY_PAGE_COPY.heroTitleLead}
        heroTitleAccent={TRUSTED_BY_PAGE_COPY.heroTitleAccent}
        heroSubtitle={TRUSTED_BY_PAGE_COPY.heroSubtitle}
        overviewKicker={TRUSTED_BY_PAGE_COPY.overviewKicker}
        overviewTitle={TRUSTED_BY_PAGE_COPY.overviewTitle}
        overviewDescription={TRUSTED_BY_PAGE_COPY.overviewDescription}
        statsKicker={TRUSTED_BY_PAGE_COPY.statsKicker}
        clients={TRUSTED_BY_CLIENTS}
        rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}
        quotesKicker={TRUSTED_BY_PAGE_COPY.quotesKicker}
        quotesTitle={TRUSTED_BY_PAGE_COPY.quotesTitle}
        quotes={TRUSTED_BY_PAGE_COPY.quotes}
        sectors={sectors}
        rosterKicker={TRUSTED_BY_PAGE_COPY.rosterKicker}
        sectorsKicker={TRUSTED_BY_PAGE_COPY.sectorsKicker}
        sectorsTitle={TRUSTED_BY_PAGE_COPY.sectorsTitle}
        sectorsDescription={TRUSTED_BY_PAGE_COPY.sectorsDescription}
        ctaKicker={TRUSTED_BY_PAGE_COPY.ctaKicker}
        ctaTitleLead={TRUSTED_BY_PAGE_COPY.ctaTitleLead}
        ctaTitleAccent={TRUSTED_BY_PAGE_COPY.ctaTitleAccent}
        ctaDescription={TRUSTED_BY_PAGE_COPY.ctaDescription}
        ctaPrimary={TRUSTED_BY_PAGE_COPY.ctaPrimary}
        ctaSecondary={TRUSTED_BY_PAGE_COPY.ctaSecondary}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
