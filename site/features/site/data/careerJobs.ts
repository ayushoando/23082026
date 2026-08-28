/**
 * Career job listing data. This is structural (title/department/location/date)
 * rather than translatable marketing copy, so it lives outside `routeCopy.ts`
 * and may be imported directly by App Router pages without tripping the
 * marketing-copy-source i18n audit (`scripts/check-site-ui-contract.mjs`).
 */
export const CAREER_PAGE_JOBS = [
  {
    title: "Project Sales Manager",
    department: "Enterprise Sales",
    location: "India (multi-city)",
    // Real posting dates supplied by the owner 2026-08-16 — required for
    // JobPosting datePosted (Google rich-result mandatory property).
    postedDate: "2026-08-12",
  },
  {
    title: "Sales Executive",
    department: "Sales",
    location: "India",
    postedDate: "2026-08-14",
  },
] as const;
