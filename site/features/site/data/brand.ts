/**
 * Brand authority for titles, OG, and structured data.
 *
 * Visible UI uses `displayName` ("One and Only"). Search titles, OG, and
 * schema stay on `companyName` ("One and Only").
 */
export const SITE_BRAND = {
  /** Spoken / on-page mark (logo alt, header, footer, body copy). */
  displayName: "One and Only",
  /** SEO / schema mark. Do not use this in visible marketing chrome. */
  companyName: "One and Only",
  titleSuffix: "One and Only",
  siteName: "One and Only",
  utilityTagline: "",
  /** Registered / legal entity name used in policies and schema. */
  legalName: "One and Only Furniture Private Limited",
  /**
   * Names people type into Google / maps — not a second brand.
   * Included in meta keywords and schema.org `alternateName`.
   */
  alternateNames: [
    "One and Only",
    "One and Only Furniture",
    "OneandOnly",
    "One and Only Furniture Patna",
    "One and Only Patna",
    "Oando",
    "OandO",
    "oando furniture",
  ],
  /**
   * Homepage + root document title: keep One and Only first, then the
   * spoken/search form so SERPs match common queries.
   */
  defaultTitle:
    "One and Only Furniture | Office Solutions India",
  description:
    "One and Only (One and Only Furniture) — premium ergonomic office furniture for modern workplaces across India. Workstations, seating, storage, tables, and soft seating with planning-led delivery nationwide.",
  organizationDescription:
    "One and Only, also known as One and Only Furniture, supplies planning-led office furniture systems for modern workplaces across India, multi-city rollouts, and enterprise projects.",
  localBusinessDescription:
    "One and Only Furniture (One and Only) — premium ergonomic office furniture for commercial workplaces across India. Patna showroom and HQ at Jagat Trade Centre, Frazer Road. Authorized dealer for Steelcase, Featherlite, Humanscale, and other leading office furniture brands.",
  /**
   * Shared keyword set for root metadata (and pages that merge brand terms).
   * Prefer natural phrases people actually search.
   */
  brandKeywords: [
    "One and Only",
    "One and Only Furniture",
    "One and Only Furniture Patna",
    "One and Only Patna",
    "oando",
    "oando furniture",
    "office furniture India",
    "office furniture Patna",
    "office furniture Bihar",
    "premium office furniture",
    "commercial office furniture India",
    "ergonomic office chairs India",
    "modular office workstations",
    "corporate office furniture",
    "Steelcase Featherlite Humanscale dealer",
    "workspace planning furniture",
    "turnkey office furniture India",
    "enterprise office fit-out",
  ],
  ogImage: "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
} as const;
