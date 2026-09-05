import { HomeMarketingLayout } from "@/components/home/layout";
import {
  SpaceCalculator,
  type SpaceCalculatorPreset,
} from "@/components/tools/SpaceCalculator";
import { OFFICE_SPACE_CALCULATOR_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const TOOL_PATH = "/tools/office-space-calculator";

const OFFICE_PRESETS: readonly SpaceCalculatorPreset[] = [
  {
    id: "open-workspace",
    label: "Open workspace",
    description: "A collaborative setting with shared workstations and a 32% planning circulation allowance.",
    circulationFraction: 0.32,
    areaPerPersonSqm: 6,
  },
  {
    id: "focused-workstations",
    label: "Focused workstations",
    description: "A more enclosed workstation setting with a 35% planning circulation allowance.",
    circulationFraction: 0.35,
    areaPerPersonSqm: 8,
  },
  {
    id: "training-space",
    label: "Training space",
    description: "A flexible learning setup with a 28% planning circulation allowance.",
    circulationFraction: 0.28,
    areaPerPersonSqm: 3,
  },
];

const TOOL_FAQS = [
  {
    question: "How does the office space calculator work?",
    answer:
      "It multiplies the room length and width to establish gross area, applies the selected planning circulation allowance, and divides the remaining area by the preset’s indicative area per workstation or learner.",
  },
  {
    question: "Which planning preset should I choose?",
    answer:
      "Choose Open workspace for shared benching, Focused workstations where each user needs more personal territory, or Training space for learning and presentation layouts. Start broad, then refine with a site plan.",
  },
  {
    question: "Is this a compliance calculation?",
    answer:
      "No. The tool supports early workspace planning only. A final layout must be verified against the applicable building, fire, accessibility, and local approval requirements for the actual site.",
  },
  {
    question: "What should happen after the estimate?",
    answer:
      "Use the result to frame a planning brief, then move into a measured layout and furniture specification with the project team before procurement or construction decisions are made.",
  },
] as const;

export const metadata = OFFICE_SPACE_CALCULATOR_PAGE_METADATA;

export default async function OfficeSpaceCalculatorPage() {
  const nonce = await getRequestNonce();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Office Space Calculator", path: TOOL_PATH },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <section className="home-section" aria-labelledby="tool-heading">
        <div className="home-section__inner">
          <p className="home-kicker">Free planning tool</p>
          <h1 id="tool-heading" className="home-heading">
            Office Space Calculator
          </h1>
          <p className="home-lead">
            Turn a rectangular room into a first-pass workspace capacity estimate. Choose a
            planning preset to see gross area, allowance for circulation, usable planning area,
            and an indicative workstation count.
          </p>

          <SpaceCalculator
            id="office-space-calculator"
            title="Map the capacity before the layout."
            capacityLabel="workstations"
            initialPresetId="open-workspace"
            presets={OFFICE_PRESETS}
          />

          <div className="tools-faq">
            <h2>Office space planning questions</h2>
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
