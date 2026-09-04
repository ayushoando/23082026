import { HomeMarketingLayout } from "@/components/home/layout";
import {
  SpaceCalculator,
  type SpaceCalculatorPreset,
} from "@/components/tools/SpaceCalculator";
import { MEETING_ROOM_CAPACITY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const TOOL_PATH = "/tools/meeting-room-capacity-calculator";

const MEETING_ROOM_PRESETS: readonly SpaceCalculatorPreset[] = [
  {
    id: "boardroom",
    label: "Boardroom",
    description: "A formal meeting layout with a central table and a 25% planning circulation allowance.",
    circulationFraction: 0.25,
    areaPerPersonSqm: 2.2,
  },
  {
    id: "collaboration",
    label: "Collaboration room",
    description: "A flexible meeting setting with movable furniture and a 22% planning circulation allowance.",
    circulationFraction: 0.22,
    areaPerPersonSqm: 1.8,
  },
  {
    id: "training",
    label: "Training room",
    description: "A classroom-oriented setup with a 28% planning circulation allowance.",
    circulationFraction: 0.28,
    areaPerPersonSqm: 1.6,
  },
];

const TOOL_FAQS = [
  {
    question: "How is meeting room capacity estimated?",
    answer:
      "The tool calculates the room’s gross area, removes the selected planning allowance for movement around furniture, and divides the remainder by the preset’s indicative area per attendee.",
  },
  {
    question: "Why use different room presets?",
    answer:
      "A boardroom, collaboration room, and training room need different circulation and individual-space assumptions. The presets make those trade-offs visible before a detailed layout is drawn.",
  },
  {
    question: "Can the result be used for occupancy or fire approval?",
    answer:
      "No. It is an early planning estimate, not an occupancy, egress, accessibility, or fire-safety determination. Verify the final room with the project’s qualified consultants and local authority requirements.",
  },
  {
    question: "How do I turn an estimate into a room layout?",
    answer:
      "Use the estimate to define the brief, then test table sizes, screen position, doors, circulation, and furniture clearances in a measured layout before committing to a specification.",
  },
] as const;

export const metadata = MEETING_ROOM_CAPACITY_PAGE_METADATA;

export default function MeetingRoomCapacityCalculatorPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Meeting Room Capacity Calculator", path: TOOL_PATH },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <section className="home-section" aria-labelledby="tool-heading">
        <div className="home-section__inner">
          <p className="home-kicker">Free planning tool</p>
          <h1 id="tool-heading" className="home-heading">
            Meeting Room Capacity Calculator
          </h1>
          <p className="home-lead">
            Test a meeting room’s first-pass capacity before the detailed layout work begins.
            Choose a room setup to compare gross area, planning circulation, usable room area,
            and an indicative attendee count.
          </p>

          <SpaceCalculator
            id="meeting-room-capacity-calculator"
            title="Balance capacity with room usability."
            capacityLabel="attendees"
            initialPresetId="boardroom"
            presets={MEETING_ROOM_PRESETS}
          />

          <div className="tools-faq">
            <h2>Meeting room planning questions</h2>
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
