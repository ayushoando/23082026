import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { PlanningPageView } from "@/components/planning/PlanningPageView";
import {
  PLANNING_PAGE_COPY,
  PLANNING_PAGE_DELIVERABLES,
  PLANNING_PAGE_STEPS,
} from "@/features/site/data/routeCopy";
import { PLANNING_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata: Metadata = PLANNING_PAGE_METADATA;

export default async function PlanningPage() {
  const copy = await withLocaleCopy({ ...PLANNING_PAGE_COPY }, "planning");
  const planningJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/planning",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Planning", path: "/planning" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(planningJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <PlanningPageView
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        craftQuote={copy.craftQuote}
        craftAttribution={copy.craftAttribution}
        primaryCta={copy.primaryCta}
        plannerCta={copy.plannerCta}
        tertiaryCta={copy.tertiaryCta}
        workflowKicker={copy.workflowKicker}
        workflowTitle={copy.workflowTitle}
        steps={PLANNING_PAGE_STEPS}
        deliverablesKicker={copy.deliverablesKicker}
        deliverablesTitle={copy.deliverablesTitle}
        deliverables={PLANNING_PAGE_DELIVERABLES}
        bestForKicker={copy.bestForKicker}
        bestForDescription={copy.bestForDescription}
        deskKicker={copy.deskKicker}
        deskTitle={copy.deskTitle}
        deskDescription={copy.deskDescription}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
