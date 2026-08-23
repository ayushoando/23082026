"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Buildings,
  House,
  MagnifyingGlass,
  PencilSimple,
  SquaresFour,
  UserCircle,
} from "@phosphor-icons/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { MobileNavDrawer } from "@/components/site/MobileNavDrawer";
import { FooterLogoMarquee } from "@/components/site/FooterLogoMarquee";
import { SiteFooter } from "@/components/site/Footer";
import { isPlannerEntryHref } from "@/lib/analytics/plannerEntry";
import { MOBILE_TABS, activeTabFor } from "@/features/site/data/navigation";
import { resolveRouteChromeMode } from "@/features/site/data/routeChromeRules";
import { trackSiteTabSelected } from "@/lib/analytics/siteEvents";

const ICONS = { House, SquaresFour, PencilSimple, Buildings, UserCircle } as const;

export function MobileAppShell({
  children,
  primaryAction,
}: {
  children: ReactNode;
  primaryAction?: { label: string; href: string };
}) {
  const pathname = usePathname() || "/";
  const active = activeTabFor(pathname);
  const [navOpen, setNavOpen] = useState(false);
  const showSiteFooter = resolveRouteChromeMode(pathname).footer === "full";

  return (
    <div className="mobile-app-shell">
      <header className="mobile-app-bar">
        <Link href="/" aria-label="One and Only — home" className="mobile-app-bar__brand">
          <OneAndOnlyLogo variant="orange" className="h-7" />
        </Link>
        <div className="mobile-app-bar__actions">
          {primaryAction ? (
            <TrackedLink
              href={primaryAction.href}
              label={primaryAction.label}
              surface="mobile-app-bar"
              className="btn-primary mobile-app-bar__cta"
            >
              {primaryAction.label}
            </TrackedLink>
          ) : (
            <span className="mobile-app-bar__spacer" />
          )}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls="mobile-nav-drawer"
            aria-haspopup="dialog"
            onClick={() => setNavOpen(true)}
            className="mobile-app-bar__menu hamburger-btn shell-icon-button"
          >
            <span className="hamburger-line" aria-hidden="true" />
            <span className="hamburger-line" aria-hidden="true" />
            <span className="hamburger-line" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Open search"
            aria-expanded={navOpen}
            aria-controls="mobile-nav-drawer"
            aria-haspopup="dialog"
            onClick={() => setNavOpen(true)}
            className="mobile-app-bar__search shell-icon-button"
          >
            <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="mobile-app-main" tabIndex={-1}>
        {children}
        {showSiteFooter ? (
          <div className="mobile-app-footer">
            <FooterLogoMarquee />
            <SiteFooter />
          </div>
        ) : null}
      </div>
      <nav className="mobile-tab-bar" aria-label="Mobile primary">
        {MOBILE_TABS.map((tab) => {
          const Icon = ICONS[tab.icon];
          const isPlanner = isPlannerEntryHref(tab.href);
          const LinkCmp = isPlanner ? PlannerLaunchLink : TrackedLink;
          const isActive = active === tab.id;
          return (
            <LinkCmp
              key={tab.id}
              href={tab.href}
              label={tab.label}
              surface="mobile-tab-bar"
              onClick={() =>
                trackSiteTabSelected({ pathname, tab: tab.id, destination: tab.href })
              }
              className={`mobile-tab${isActive ? " mobile-tab--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              <span className="mobile-tab__label">{tab.label}</span>
            </LinkCmp>
          );
        })}
      </nav>
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  );
}
