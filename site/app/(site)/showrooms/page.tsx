import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ShowroomsPageView } from "@/components/showrooms/ShowroomsPageView";
import {
  SHOWROOMS_HIGHLIGHTS,
  SHOWROOMS_PAGE_COPY,
} from "@/features/site/data/routeCopy";
import { SHOWROOMS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = SHOWROOMS_PAGE_METADATA;

export default async function ShowroomsPage() {
  const copy = await withLocaleCopy({ ...SHOWROOMS_PAGE_COPY }, "showrooms");
  const showroomsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/showrooms",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Showrooms", path: "/showrooms" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(showroomsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <ShowroomsPageView
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        craftQuote={copy.craftQuote}
        craftAttribution={copy.craftAttribution}
        visitKicker={copy.visitKicker}
        visitTitle={copy.visitTitle}
        visitCta={copy.visitCta}
        visitRows={copy.visitRows}
        highlightsKicker={copy.highlightsKicker}
        highlightsTitle={copy.highlightsTitle}
        highlights={SHOWROOMS_HIGHLIGHTS}
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
