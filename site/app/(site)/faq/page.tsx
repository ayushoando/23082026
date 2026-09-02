import type { Metadata } from "next";

import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { HOMEPAGE_FAQ_CONTENT } from "@/features/site/data/homepage";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageJsonLd,
  buildPageMetadata,
} from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const FAQ_PATH = "/faq";
const FAQ_TITLE = "FAQ — Delivery, installation, and warranty";
const FAQ_DESCRIPTION =
  "Answers on where we deliver, installation, warranty, and multi-site office rollouts. Contact us if your question is not listed.";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: FAQ_TITLE,
  description: FAQ_DESCRIPTION,
  path: FAQ_PATH,
});

export default function FaqPage() {
  const faqJsonLd = buildFaqJsonLd(
    SITE_URL,
    FAQ_PATH,
    HOMEPAGE_FAQ_CONTENT.items.map((item) => ({
      question: item.q,
      answer: item.a,
    })),
  );
  const pageJsonLd = buildPageJsonLd(SITE_URL, {
    path: FAQ_PATH,
    title: FAQ_TITLE,
    description: FAQ_DESCRIPTION,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "FAQ", path: FAQ_PATH },
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
      <HomeSection variant="white" spacing="md">
        <HomeSectionInner>
          <p className="home-kicker">Help</p>
          <h1 className="home-heading">{HOMEPAGE_FAQ_CONTENT.titleLead}</h1>
          <p className="home-lead">{FAQ_DESCRIPTION}</p>
          <div className="tools-faq">
            <dl>
              {HOMEPAGE_FAQ_CONTENT.items.map((item) => (
                <div key={item.q}>
                  <dt className="home-faq-question">{item.q}</dt>
                  <dd className="home-copy">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </HomeSectionInner>
      </HomeSection>
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
