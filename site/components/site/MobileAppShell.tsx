"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Buildings,
  MagnifyingGlass,
  PencilSimple,
  SquaresFour,
  UserCircle,
  UsersThree,
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

const ICONS = { SquaresFour, PencilSimple, UsersThree, Buildings, UserCircle } as const;

/**
 * Marketing pages carry a single primary conversion — "Get Quote". On routes
 * that already own an app action (planner/canvas, account), no extra top-bar
 * CTA is shown; the tab bar + route chrome already cover it.
 */
function mobilePrimaryAction(
  pathname: string,
  t: ReturnType<typeof useTranslations<"marketing.chrome">>,
): { label: string; href: string } | null {
  const p = (pathname || "/").replace(/\/+$/, "") || "/";
  if (p.startsWith("/ooplanner") || p.startsWith("/planner")) return null;
  if (p.startsWith("/access") || p.startsWith("/dashboard") || p.startsWith("/portal")) {
    return null;
  }
  return { label: t("mobile.getQuote"), href: "/contact" };
}

export function MobileAppShell({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("marketing.chrome");
  const pathname = usePathname() || "/";
  const active = activeTabFor(pathname);
  const [navOpen, setNavOpen] = useState(false);
  const showSiteFooter = resolveRouteChromeMode(pathname).footer === "full";
  const primaryAction = mobilePrimaryAction(pathname, t);

  return (
    <div className="mobile-app-shell">
      <header className="mobile-app-bar">
        <Link href="/" aria-label={t("header.homeLabel")} className="mobile-app-bar__brand">
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
            aria-label={t("header.openMenu")}
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
            aria-label={t("mobile.openSearch")}
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
      <nav className="mobile-tab-bar" aria-label={t("mobile.primaryNavigation")}>
        {MOBILE_TABS.map((tab) => {
          const Icon = ICONS[tab.icon];
          const isPlanner = isPlannerEntryHref(tab.href);
          const LinkCmp = isPlanner ? PlannerLaunchLink : TrackedLink;
          const isActive = active === tab.id;
          const tabLabel = t(
            tab.id === "catalog"
              ? "navigation.allProducts"
              : tab.id === "planner"
                ? "navigation.planner"
                : tab.id === "clients"
                  ? "navigation.portfolio"
                  : tab.id === "about"
                    ? "navigation.about"
                    : "navigation.signIn",
          );
          return (
            <LinkCmp
              key={tab.id}
              href={tab.href}
              label={tabLabel}
              surface="mobile-tab-bar"
              onClick={() =>
                trackSiteTabSelected({ pathname, tab: tab.id, destination: tab.href })
              }
              className={`mobile-tab${isActive ? " mobile-tab--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              <span className="mobile-tab__label">{tabLabel}</span>
            </LinkCmp>
          );
        })}
      </nav>
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  );
}
