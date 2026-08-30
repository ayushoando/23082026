import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ServicePageView } from "@/components/service/ServicePageView";
import {
  SERVICE_PAGE_CHANNELS,
  SERVICE_PAGE_COPY,
  SERVICE_PAGE_PILLARS,
} from "@/features/site/data/routeCopy";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadServiceCopy() {
  return withLocaleCopy(
    {
      ...SERVICE_PAGE_COPY,
      pillars: SERVICE_PAGE_PILLARS,
      channels: SERVICE_PAGE_CHANNELS,
    },
    "service",
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadServiceCopy();
  return buildPageMetadata(SITE_URL, {
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    path: "/service",
  });
}

export default async function ServicePage() {
  const copy = await loadServiceCopy();
  const serviceJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/service",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: copy.heroTitle, path: "/service" },
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
        pillars={copy.pillars}
        channelsKicker={copy.channelsKicker}
        channelsTitle={copy.channelsTitle}
        channels={copy.channels}
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
