import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const TOOL_PATH = "/tools/office-space-calculator";
const TOOL_TITLE =
  "Office Space Calculator — Workstations per Sq Ft (India NBC) | One&Only";
const TOOL_DESCRIPTION =
  "Plan commercial workstations per square foot with India NBC circulation norms. Enter length and width, select a density preset, and receive instant gross area, usable area after circulation, and workstation count recommendations.";

const TOOL_FAQS = [
  {
    question: "What NBC circulation deduction does this calculator use?",
    answer:
      "The calculator deducts a planning circulation ratio per density preset (open office 32%, cubicle 35%, meeting 25%, classroom 28%, clinic waiting 30%) from gross floor area to determine net usable space before calculating seat counts. These ratios reflect National Building Code of India (NBC 2016) commercial occupancy and circulation allowances.",
  },
  {
    question: "Which density preset should I choose for my office?",
    answer:
      "Select Open Office (6 sqm gross per seat) for collaborative linear benches and hot-desks, Cubicle (8 sqm) for 120° or partitioned workstations with dedicated storage, and Meeting (2.2 sqm) for conference and presentation spaces.",
  },
  {
    question: "How accurate is the seat count estimate?",
    answer:
      "The result provides an architecturally accurate seat-capacity planning range based on standard floorplate efficiency. For exact millimeter-level layout fitting and product placement, use our interactive Planner workspace.",
  },
  {
    question: "Do I need to create an account or provide contact details?",
    answer:
      "No — this planning calculator is completely free, open, and ungated. You can test multiple room configurations and density ratios immediately.",
  },
] as const;

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: TOOL_TITLE,
  description: TOOL_DESCRIPTION,
  path: TOOL_PATH,
  indexable: false,
  keywords: [
    "office space calculator India",
    "workstations per sq ft",
    "office seating capacity India",
    "NBC office space norms",
    "how many workstations per square foot",
  ],
});

export default function OfficeSpaceCalculatorPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Office Space Calculator", path: TOOL_PATH },
  ]);
  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <section className="home-section" aria-labelledby="tool-heading">
        <div className="home-section__inner">
          <p className="home-kicker">Free tools · India NBC norms</p>
          <h1 id="tool-heading" className="home-heading">
            Office Space Calculator
          </h1>
          <p className="home-lead">
            Enter room length and width in metres, choose a density preset
            calibrated to Indian NBC circulation allowances, and receive instant
            calculations for gross area, usable area, and workstation capacity.
          </p>
          <div
            className="tools-engine-placeholder"
            data-testid="office-space-calculator-placeholder"
          >
            <p>
              Interactive calculator interface — adjust dimensions and density
              presets to explore floorplate utilization, circulation efficiency,
              and workstation counts for your commercial fit-out.
            </p>
          </div>
          <div className="tools-faq">
            <h2>Frequently Asked Questions</h2>
            <dl>
              {TOOL_FAQS.map((faq) => (
                <div key={faq.question}>
                  <dt>{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </HomeMarketingLayout>
  );
}
