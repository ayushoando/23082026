/**
 * Planning page media — graded install still only (no hero video).
 * Poster-first LCP; reduced-motion stays on the still.
 */
export const PLANNING_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  alt: "Workspace planning session with floor layout and furniture specification",
} as const;

export const PLANNING_HERO_MEDIA = {
  poster: PLANNING_HERO_IMAGE.src,
} as const;

/** Installed-workplace photography used to ground the planning process in real spaces. */
export const PLANNING_PROJECT_IMAGES = [
  {
    src: "/assets/marketing/projects/Titan/titan-office.webp",
    alt: "Open office with shared workstations and partition screens",
  },
  {
    src: "/assets/marketing/projects/DMRC/dmrc-office-01.webp",
    alt: "Workstations arranged around blue partition screens",
  },
] as const;
