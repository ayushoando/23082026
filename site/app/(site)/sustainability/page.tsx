import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SustainabilityPageView } from "@/components/sustainability/SustainabilityPageView";
import { SUSTAINABILITY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SUSTAINABILITY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = SUSTAINABILITY_PAGE_METADATA;

/**
 * Editorial sustainability — photography-forward hero, bronze punctuation, pillar rows.
 */
export default async function SustainabilityPage() {
  const copy = await withLocaleCopy({ ...SUSTAINABILITY_PAGE_COPY }, "sustainability");
  const sustainabilityJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/sustainability",
    title: "Sustainable office furniture | One&Only",
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Sustainability", path: "/sustainability" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(sustainabilityJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <SustainabilityPageView
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        heroCta={copy.heroCta}
        craftQuote={copy.craftQuote}
        craftAttribution={copy.craftAttribution}
        commitmentsKicker={copy.commitmentsKicker}
        commitmentsTitle={copy.commitmentsTitle}
        commitments={copy.commitments}
        introKicker={copy.introKicker}
        introTitleLeadShort={copy.introTitleLeadShort}
        introTitleAccent={copy.introTitleAccent}
        introDescription={copy.introDescription}
        introPoints={copy.introPoints}
        ecoScoreTitle={copy.ecoScoreTitle}
        ecoScoreDescription={copy.ecoScoreDescription}
        ecoScoreItems={copy.ecoScoreItems}
        ctaKicker={copy.ctaKicker}
        ctaTitleLead={copy.ctaTitleLead}
        ctaTitleAccent={copy.ctaTitleAccent}
        ctaDescription={copy.ctaDescription}
        ctaPrimary={copy.ctaPrimary}
        ctaSecondary={copy.ctaSecondary}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
