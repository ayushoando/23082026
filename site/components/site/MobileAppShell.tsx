"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatCircle,
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
import { registerGsapPlugins } from "@/lib/helpers/gsapMotion";

const ICONS = { SquaresFour, PencilSimple, UsersThree, ChatCircle, UserCircle } as const;

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

  // Parent render runs before child useGSAP; bind `.mobile-app-main` first.
  registerGsapPlugins();
  useLayoutEffect(() => {
    registerGsapPlugins(true);
  }, [pathname]);

  return (
    <div className="mobile-app-shell">
      <header className="mobile-app-bar">
        <Link href="/" aria-label={t("header.homeLabel")} className="mobile-app-bar__brand">
          <OneAndOnlyLogo variant="orange" className="h-7" />
        </Link>
        <div className="mobile-app-bar__actions">
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
          const tabLabel = t(tab.chromeKey);
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
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} variant="mobile" />
    </div>
  );
}
