import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ServicePageView } from "@/components/service/ServicePageView";
import {
  SERVICE_PAGE_CHANNELS,
  SERVICE_PAGE_COPY,
  SERVICE_PAGE_PILLARS,
} from "@/features/site/data/routeCopy";
import { SERVICE_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = SERVICE_PAGE_METADATA;

export default async function ServicePage() {
  const copy = await withLocaleCopy({ ...SERVICE_PAGE_COPY }, "service");
  const serviceJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/service",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Service", path: "/service" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <ServicePageView
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        craftQuote={copy.craftQuote}
        craftAttribution={copy.craftAttribution}
        frameworkKicker={copy.frameworkKicker}
        frameworkTitle={copy.frameworkTitle}
        pillars={SERVICE_PAGE_PILLARS}
        channelsKicker={copy.channelsKicker}
        channelsTitle={copy.channelsTitle}
        channels={SERVICE_PAGE_CHANNELS}
        supportKicker={copy.supportKicker}
        supportDescription={copy.supportDescription}
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
