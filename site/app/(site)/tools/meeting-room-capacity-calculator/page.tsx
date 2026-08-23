import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const TOOL_PATH = "/tools/meeting-room-capacity-calculator";
const TOOL_TITLE = "Meeting Room Capacity Calculator — India NBC | One&Only";
const TOOL_DESCRIPTION =
  "Calculate meeting-room seating capacity from room dimensions with India NBC circulation norms. Enter length and width, select your layout preset, and get instant usable area and seat count recommendations for your workspace.";

const TOOL_FAQS = [
  {
    question: "How is meeting room capacity calculated?",
    answer:
      "Gross area is calculated from length × width, usable area is derived by applying National Building Code (NBC) circulation allowances for the selected room preset (25% for conference/boardroom setups), and total capacity is determined by dividing usable area by standard square metres per seat (2.2 sqm per seat for conference setups).",
  },
  {
    question: "What room configurations work best with this tool?",
    answer:
      "The calculator supports standard rectangular meeting and conference spaces in metres, with density presets tailored for formal boardrooms, collaborative meeting rooms, classroom training setups, and hybrid open-office huddle spaces.",
  },
  {
    question: "How does NBC compliance affect meeting room planning?",
    answer:
      "The National Building Code of India (NBC 2016) specifies minimum occupant load allowances and mandatory egress circulation paths. Adhering to these standards ensures your conference rooms remain safe, comfortable, and fully compliant with fire and occupancy regulations.",
  },
  {
    question: "Do I need an account or email to use this tool?",
    answer:
      "No — this calculator is completely free, open, and ungated. You can calculate room capacities immediately without creating an account or providing contact details.",
  },
] as const;

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: TOOL_TITLE,
  description: TOOL_DESCRIPTION,
  path: TOOL_PATH,
  indexable: false,
  keywords: [
    "meeting room capacity calculator",
    "meeting room seating capacity",
    "conference room capacity calculator India",
    "NBC meeting room norms",
    "how many seats in meeting room",
  ],
});

export default function MeetingRoomCapacityCalculatorPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
    { name: "Meeting Room Capacity Calculator", path: TOOL_PATH },
  ]);
  return (
    <HomeMarketingLayout>
      <script type="application/ld+json" suppressHydrationWarning>
        {sanitizeJsonForScript(breadcrumbJsonLd)}
      </script>
      <section className="home-section" aria-labelledby="tool-heading">
        <div className="home-section__inner">
          <p className="home-kicker">Free tools · India NBC norms</p>
          <h1 id="tool-heading" className="home-heading">
            Meeting Room Capacity Calculator
          </h1>
          <p className="home-lead">
            Enter meeting-room length and width in metres, pick a density preset
            with India-calibrated circulation allowances, and receive instant
            recommendations for usable area and comfortable seating capacity.
          </p>
          <div
            className="tools-engine-placeholder"
            data-testid="meeting-room-capacity-calculator-placeholder"
          >
            <p>
              Interactive calculator interface — select dimensions and room
              preset to view instant area breakdown and recommended seating
              capacity according to Indian commercial building standards.
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
