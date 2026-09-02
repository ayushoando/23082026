import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { FaqPageView } from "@/components/faq/FaqPageView";
import { FAQ_PAGE_COPY } from "@/features/site/data/routeCopy";
import { FAQ_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageJsonLd,
} from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const FAQ_PATH = "/faq";

async function loadFaqCopy() {
  return withLocaleCopy({ ...FAQ_PAGE_COPY }, "faq");
}

export async function generateMetadata(): Promise<Metadata> {
  return FAQ_PAGE_METADATA;
}

export default async function FaqPage() {
  const copy = await loadFaqCopy();
  const faqJsonLd = buildFaqJsonLd(
    SITE_URL,
    FAQ_PATH,
    copy.items.map((item) => ({ question: item.q, answer: item.a })),
  );
  const pageJsonLd = buildPageJsonLd(SITE_URL, {
    path: FAQ_PATH,
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: copy.heroTitle, path: FAQ_PATH },
  ]);

  return (
    <HomeMarketingLayout>
      {[pageJsonLd, breadcrumbJsonLd, faqJsonLd].map((jsonLd) => (
        <script
          key={String(jsonLd["@type"])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(jsonLd) }}
        />
      ))}
      <FaqPageView
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        items={copy.items}
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
