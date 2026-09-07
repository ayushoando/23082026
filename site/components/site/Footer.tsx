"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import {
  buildMailtoHref,
  formatSitePostalAddress,
  SITE_CONTACT,
  toTelHref,
} from "@/features/site/data/contact";
import { SITE_FOOTER_NAV, SITE_SOCIAL_LINKS } from "@/features/site/data/navigation";

import { Envelope, FacebookLogo, Phone, YoutubeLogo } from "@phosphor-icons/react";

const phIconMap = {
  facebook: FacebookLogo,
  youtube: YoutubeLogo,
  phone: Phone,
  envelope: Envelope,
} as const;

type PhIconName = keyof typeof phIconMap;

function PhIcon({ name, className, size = 20 }: { name: PhIconName; className?: string; size?: number }) {
  const Icon = phIconMap[name];
  return <Icon size={size} className={className} aria-hidden="true" />;
}

const SOCIAL_ICON_NAMES: Record<string, PhIconName> = {
  facebook: "facebook",
  youtube: "youtube",
};

/** Shared focus + hover chrome for footer controls. */
const footerInteractiveClass =
  "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** ≥48px text links (phone, email, nav, legal). */
const footerTextLinkClass = `site-footer__link ${footerInteractiveClass} inline-flex min-h-12 items-center gap-2 py-1`;

/** Social targets — ≥48×48; inverse-muted icons (see `.site-footer__social` in FOCSS). */
const footerSocialClass = `site-footer__social ${footerInteractiveClass} inline-flex min-h-12 min-w-12 items-center justify-center`;

const FOOTER_LABEL_KEYS: Record<string, string> = {
  "All Products": "navigation.allProducts",
  Solutions: "navigation.solutions",
  Portfolio: "navigation.portfolio",
  Clients: "navigation.clients",
  Planner: "navigation.planner",
  "Planner help": "navigation.plannerHelp",
  Tools: "navigation.tools",
  "About Us": "navigation.about",
  "Trusted By": "navigation.trustedBy",
  Sustainability: "navigation.sustainability",
  Showrooms: "navigation.showrooms",
  Careers: "navigation.careers",
  Contact: "navigation.contact",
  "Contact Us": "navigation.contactUs",
  Planning: "navigation.planning",
  FAQ: "navigation.faq",
  "After Sales": "navigation.afterSales",
  Downloads: "navigation.downloads",
};

const FOOTER_HEADING_KEYS: Record<string, string> = {
  Products: "products",
  Company: "company",
  Services: "services",
};

export function SiteFooter() {
  const t = useTranslations("marketing.chrome");
  const footerLabel = (label: string) =>
    t(FOOTER_LABEL_KEYS[label] ?? label);
  const footerHeading = (heading: string) =>
    t(`footer.${FOOTER_HEADING_KEYS[heading] ?? heading}`);
  // useSyncExternalStore guarantees the same snapshot is used for SSR and
  // hydration, eliminating the classic new Date() hydration mismatch that
  // occurs when server and client clocks disagree (year boundary, timezone).
  const currentYear = useSyncExternalStore(
    () => () => {},
    () => new Date().getFullYear(),
    () => new Date().getFullYear(),
  );

  return (
    <footer className="site-footer w-full surface-inverse text-inverse">
      {/* home-shell-xl matches marketing body insets (shell-container is wider/off-axis). */}
      <div className="home-shell-xl site-footer__main">
        <div className="site-footer__columns">
          <div className="site-footer__brand-col flex min-w-0 flex-col gap-4">
            <Link
              href="/"
              prefetch={false}
              aria-label={t("header.homeLabel")}
              className={`${footerTextLinkClass}`}
            >
              <OneAndOnlyLogo variant="orange" className="h-9" />
            </Link>

            <div className="site-footer__contact-stack flex flex-col gap-2">
              <address className="site-footer__address site-footer__contact-line whitespace-pre-line not-italic text-sm leading-relaxed">
                {formatSitePostalAddress()}
              </address>
              <a
                href={toTelHref(SITE_CONTACT.supportPhone)}
                className={`site-footer__contact-line ${footerTextLinkClass} text-sm`}
              >
                <PhIcon name="phone" size={16} className="shrink-0 text-primary" />
                <span>+91 90310 22875</span>
              </a>
              <a
                href={buildMailtoHref()}
                className={`site-footer__contact-line ${footerTextLinkClass} text-sm`}
              >
                <PhIcon name="envelope" size={16} className="shrink-0 text-primary" />
                <span>{SITE_CONTACT.salesEmail}</span>
              </a>
              <div className="site-footer__social-row flex flex-wrap items-center gap-2 pt-2">
                {SITE_SOCIAL_LINKS.map((social) => {
                  const iconName = SOCIAL_ICON_NAMES[social.id];
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={footerSocialClass}
                    >
                      {iconName ? <PhIcon name={iconName} size={20} className="site-footer__social-icon h-5 w-5" /> : null}
                    </a>
                  );
                })}
              </div>
              <div className="pt-1">
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {SITE_FOOTER_NAV.map((col, index) => (
            <nav
              key={col.heading}
              aria-label={footerHeading(col.heading)}
              className={`site-footer__nav-col min-w-0 ${
                index === 0 ? "site-footer__nav-col--products" : ""
              } ${index === 1 ? "site-footer__nav-col--company" : ""} ${
                index === 2 ? "site-footer__nav-col--services" : ""
              }`.trim()}
            >
              <p className="site-footer__heading site-footer__nav-heading typ-overline mb-2 md:mb-3">
                {footerHeading(col.heading)}
              </p>
              <ul className="site-footer__nav-list flex flex-col gap-0.5">
                {col.links.map(({ href, label }) => (
                  <li key={`${href}-${label}`}>
                    <Link
                      href={href}
                      prefetch={false}
                      className={`${footerTextLinkClass} typ-body-sm`}
                    >
                      {footerLabel(label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="site-footer__divider mt-2 border-t">
        <div className="site-footer__legal-row typ-body-sm home-shell-xl py-2 md:py-4">
          <div className="site-footer__legal-links">
            <Link
              href="/refund-and-return-policy"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-12 items-center`}
            >
              {t("footer.refundPolicy")}
            </Link>
            <Link
              href="/privacy"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-12 items-center`}
            >
              {t("footer.privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-12 items-center`}
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/sitemap"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-12 items-center`}
            >
              {t("footer.sitemap")}
            </Link>
          </div>
          <p className="site-footer__legal-copy">
            &copy; <span suppressHydrationWarning>{currentYear}</span> One and Only. {t("footer.rightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
