import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { DownloadsPageView } from "@/components/downloads/DownloadsPageView";
import { DOWNLOADS_PAGE_COPY, DOWNLOADS_RESOURCE_CATEGORIES } from "@/features/site/data/routeCopy";
import { DOWNLOADS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = DOWNLOADS_PAGE_METADATA;

export default async function DownloadsPage() {
  const copy = await withLocaleCopy({ ...DOWNLOADS_PAGE_COPY }, "downloads");
  const downloadsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/downloads",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Downloads", path: "/downloads" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(downloadsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <DownloadsPageView
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        heroPrimaryCta={copy.heroPrimaryCta}
        resourceKicker={copy.resourceKicker}
        resourceTitle={copy.resourceTitle}
        resourceDescription={copy.resourceDescription}
        resources={DOWNLOADS_RESOURCE_CATEGORIES}
        processKicker={copy.processKicker}
        processTitle={copy.processTitle}
        processSteps={copy.processSteps}
        noteTitle={copy.noteTitle}
        noteBody={copy.noteBody}
        notePoints={copy.notePoints}
        urgentKicker={copy.urgentKicker}
        urgentDescription={copy.urgentDescription}
        primaryCta={copy.primaryCta}
        secondaryCta={copy.secondaryCta}
        tertiaryCta={copy.tertiaryCta}
        ctaKicker={copy.ctaKicker}
        ctaTitleLead={copy.ctaTitleLead}
        ctaTitleAccent={copy.ctaTitleAccent}
        ctaDescription={copy.ctaDescription}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
