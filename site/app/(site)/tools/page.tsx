import Link from "next/link";
import { ArrowRight, Calculator, Compass, UsersThree } from "@phosphor-icons/react/dist/ssr";

import { HomeMarketingLayout } from "@/components/home/layout";
import { TOOLS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = TOOLS_PAGE_METADATA;

const TOOLS_LIST = [
  {
    title: "Office Space Calculator",
    href: "/tools/office-space-calculator",
    kicker: "Capacity & Density",
    description:
      "Estimate workstation capacity, gross floor area, and circulation allowances from room dimensions across open-workspace, focused, and training layouts.",
    icon: Calculator,
    action: "Calculate office space",
  },
  {
    title: "Meeting Room Capacity Calculator",
    href: "/tools/meeting-room-capacity-calculator",
    kicker: "Meeting & Conference",
    description:
      "Determine attendee capacity, table clearance allowances, and circulation space for boardrooms, collaborative meeting rooms, and training setups.",
    icon: UsersThree,
    action: "Calculate room capacity",
  },
  {
    title: "Workspace Floor Planner",
    href: "/planner",
    kicker: "2D / 3D Layout Suite",
    description:
      "Draw true-to-scale floor plans, place real catalog furniture, verify spatial clearances, and generate instant bills of quantities (BOQ) with PDF export.",
    icon: Compass,
    action: "Launch floor planner",
  },
] as const;

export default function ToolsHubPage() {
  const pageJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/tools",
    title: "Workspace Planning Tools & Calculators | One&Only",
    description:
      "Free office planning tools and workspace calculators. Estimate workstation capacity, calculate meeting room sizes, and evaluate layout requirements before furnishing.",
    pageType: "CollectionPage",
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/tools" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(pageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />

      <section className="home-section border-theme-soft border-b section-y" aria-labelledby="tools-heading">
        <div className="home-shell-xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <p className="home-kicker">Free Planning Tools</p>
            <h1 id="tools-heading" className="home-heading text-strong">
              Workspace Planning Tools &amp; Calculators
            </h1>
            <p className="home-lead text-muted">
              Estimate capacity, map floor densities, and evaluate furniture requirements before
              ordering. Fast, planning-led calculations for commercial offices and institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS_LIST.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <article
                  key={tool.href}
                  className="flex flex-col justify-between rounded-xl border border-theme-soft bg-surface-panel p-6 shadow-theme-panel transition-all duration-200 hover:border-theme-strong hover:shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="typ-caption rounded-full bg-surface-subtle px-2.5 py-1 font-medium text-muted">
                        {tool.kicker}
                      </span>
                      <IconComponent size={24} className="text-primary" aria-hidden="true" />
                    </div>

                    <h2 className="typ-h3 text-strong">
                      <Link
                        href={tool.href}
                        className="rounded outline-none focus-visible:ring-2 focus-visible:ring-primary hover:text-primary"
                      >
                        {tool.title}
                      </Link>
                    </h2>

                    <p className="typ-body text-muted leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={tool.href}
                      className="inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      <span>{tool.action}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-xl border border-theme-soft bg-surface-subtle p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h3 className="typ-h3 text-strong">Need comprehensive workplace planning?</h3>
              <p className="typ-body text-muted">
                Our planning team produces detailed 2D/3D layouts, electrical/data clearances, and
                turnkey bill of quantities for multi-city commercial rollouts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/planning"
                className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-2.5 rounded font-medium text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Planning service
              </Link>
              <Link
                href="/contact"
                className="btn-secondary inline-flex min-h-11 items-center justify-center px-5 py-2.5 rounded font-medium border border-theme-soft hover:bg-surface-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Contact team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </HomeMarketingLayout>
  );
}
