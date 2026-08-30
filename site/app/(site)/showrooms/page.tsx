import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ShowroomsPageView } from "@/components/showrooms/ShowroomsPageView";
import {
  SHOWROOMS_HIGHLIGHTS,
  SHOWROOMS_PAGE_COPY,
} from "@/features/site/data/routeCopy";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadShowroomsCopy() {
  return withLocaleCopy(
    {
      ...SHOWROOMS_PAGE_COPY,
      highlights: SHOWROOMS_HIGHLIGHTS,
      mapHeading: "Find the showroom",
    },
    "showrooms",
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadShowroomsCopy();
  return buildPageMetadata(SITE_URL, {
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    path: "/showrooms",
  });
}

export default async function ShowroomsPage() {
  const copy = await loadShowroomsCopy();
  const showroomsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/showrooms",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: copy.heroTitle, path: "/showrooms" },
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
        highlights={copy.highlights}
        ctaKicker={copy.ctaKicker}
        ctaTitleLead={copy.ctaTitleLead}
        ctaTitleAccent={copy.ctaTitleAccent}
        ctaDescription={copy.ctaDescription}
        ctaPrimary={copy.ctaPrimary}
        ctaSecondary={copy.ctaSecondary}
        mapHeading={copy.mapHeading}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
