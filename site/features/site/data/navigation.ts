import { SITE_CONTACT } from "@/features/site/data/contact";
import { PRODUCT_SUITE } from "@/features/site/data/productSuite";

/**
 * Marketing header + mobile drawer destinations.
 * Products opens the category mega menu (desktop) / accordion (mobile).
 * Secondary destinations live as direct footer links (no "More" dropdown).
 */
/** Header destinations: 8 clean links as per global standard. */
export const SITE_NAV_LINKS = [
  { label: "Products", href: "/products", hasMega: true },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Clients", href: "/clients" },
  { label: "Trusted By", href: "/trusted-by" },
  /** Marketing planner landing (/planner). */
  { label: "Planner", href: PRODUCT_SUITE.planner.routes.landing },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
] as const;

export type SiteNavLink = (typeof SITE_NAV_LINKS)[number];

/** Desktop + mobile center nav — same flat list. */
export const SITE_HEADER_PRIMARY_LINKS = SITE_NAV_LINKS;

/** Overflow only — keep empty while `SITE_NAV_LINKS` fits the 8-link primary. */
export const SITE_HEADER_MORE_LINKS: readonly { label: string; href: string }[] = [];

export const SITE_CTA_LINKS = [
  { label: "Get Quote", href: "/contact", variant: "primary" as const },
  { label: "View Products", href: "/products", variant: "outline" as const },
] as const;

/** Canonical member sign-in (login route redirects here). */
export const SITE_AUTH_LINK = { label: "Sign in", href: "/access" } as const;

/** Bottom tab bar (<768). High-value only — logo already goes home; About lives in the drawer. */
export const MOBILE_TABS = [
  { id: "products", label: "Products", href: "/products", icon: "SquaresFour", chromeKey: "navigation.products" },
  { id: "planner", label: "Planner", href: PRODUCT_SUITE.planner.routes.landing, icon: "PencilSimple", chromeKey: "navigation.planner" },
  { id: "quote", label: "Quote", href: "/contact", icon: "ChatCircle", chromeKey: "mobile.quote" },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", icon: "UsersThree", chromeKey: "navigation.portfolio" },
  { id: "account", label: "Account", href: SITE_AUTH_LINK.href, icon: "UserCircle", chromeKey: "navigation.signIn" },
] as const;

export type MobileTabId = (typeof MOBILE_TABS)[number]["id"];

/** Resolve the active tab id from a pathname (null = interior page, no active tab). */
export function activeTabFor(pathname: string): MobileTabId | null {
  const p = (pathname || "/").replace(/\/+$/, "") || "/";
  if (p.startsWith("/products")) {return "products";}
  if (p.startsWith("/ooplanner") || p.startsWith("/planner")) {return "planner";}
  if (p.startsWith("/contact") || p.startsWith("/quote-cart")) {return "quote";}
  if (p.startsWith("/portfolio") || p.startsWith("/clients") || p.startsWith("/trusted-by")) {return "portfolio";}
  if (["/access", "/dashboard", "/portal", "/login"].some((s) => p.startsWith(s))) {
    return "account";
  }
  return null;
}

/** Mega-menu featured cards (search + featured surfaces). */
export const SITE_NAV_FEATURED_CARDS = [
  {
    title: "Ergonomic Seating",
    description: "Mesh chairs and premium seating for long working hours.",
    href: "/products/seating",
    image: "/assets/marketing/ui/categories/seating-clean.webp",
  },
  {
    title: "Modular Workstations",
    description: "Scalable desking systems for growing teams.",
    href: "/products/workstations",
    image: "/assets/marketing/ui/categories/workstations-clean.webp",
  },
  {
    title: "Need Help Choosing?",
    description: "Use AI-assisted search to find the right furniture faster.",
    href: "/products",
    image: "/assets/marketing/clients/Titan/titan-office.webp",
  },
] as const;

export const SITE_NAV_SEARCH_FALLBACK_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/clients", label: "Clients" },
  { href: PRODUCT_SUITE.planner.routes.landing, label: "Planner" },
  { href: PRODUCT_SUITE.planner.routes.help, label: "Planner help" },
  { href: "/trusted-by", label: "Trusted By" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
] as const;

type FooterLink = { href: string; label: string };

export function normalizeFooterHref(href: string): string {
  if (href.length > 1 && href.endsWith("/")) {return href.slice(0, -1);}
  return href;
}

/** Drop duplicate destinations across footer columns (first label wins). */
export function buildFooterNav(
  sections: { heading: string; links: readonly FooterLink[] }[],
): { heading: string; links: FooterLink[] }[] {
  const globalSeen = new Set<string>();

  return sections
    .map((section) => ({
      heading: section.heading,
      links: section.links.filter((link) => {
        const key = normalizeFooterHref(link.href);
        if (globalSeen.has(key)) {return false;}
        globalSeen.add(key);
        return true;
      }),
    }))
    .filter((section) => section.links.length > 0);
}

/**
 * Public footer — secondary destinations as direct links.
 * Client access (/access, /portal, /dashboard, /ooplanner) stays off this list.
 */
export const SITE_FOOTER_NAV = buildFooterNav([
  {
    heading: "Products",
    links: [
      { href: "/products", label: "All Products" },
      { href: PRODUCT_SUITE.planner.routes.landing, label: "Planner" },
      { href: PRODUCT_SUITE.planner.routes.help, label: "Planner help" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/clients", label: "Clients" },
      { href: "/trusted-by", label: "Trusted By" },
      { href: "/sustainability", label: "Sustainability" },
      { href: "/showrooms", label: "Showrooms" },
      { href: "/career", label: "Careers" },
    ],
  },
  {
    heading: "Services",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/planning", label: "Planning" },
      { href: "/faq", label: "FAQ" },
      { href: "/service", label: "After Sales" },
      { href: "/downloads", label: "Downloads" },
    ],
  },
]);

export const SITE_SOCIAL_LINKS = SITE_CONTACT.socialLinks;
