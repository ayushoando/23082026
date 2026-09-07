import { PlannerLandingPage } from "@/features/site/planner/landing/PlannerLandingPage";
import { PLANNER_LANDING_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = PLANNER_LANDING_PAGE_METADATA;

const PAGE_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/planner",
  title: "Workspace Planner — Design Your Office Layout",
  description:
    "Plan desks, zones, and equipment on mm-accurate floor plans with 2D, 3D, and branded PDF export.",
  pageType: "WebPage",
});

const BREADCRUMB_JSON_LD = buildBreadcrumbJsonLd(SITE_URL, [
  { name: "Home", path: "/" },
  { name: "Workspace Planner", path: "/planner" },
]);

const SOFTWARE_APP_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "One and Only Workspace Planner",
  url: `${SITE_URL}/planner`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "Browser-based 2D and 3D office floor planner with mm-accurate walls, real catalog furniture, AI layout assist, and branded PDF export for client-ready proposals.",
  featureList: [
    "2D floor plan drawing",
    "3D view",
    "Catalog furniture placement",
    "AI layout assist",
    "PDF export",
  ],
});

export default async function PlannerLandingRoute() {
  const nonce = await getRequestNonce();
  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(PAGE_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(BREADCRUMB_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(SOFTWARE_APP_JSON_LD) }}
      />
      <PlannerLandingPage />
    </>
  );
}
