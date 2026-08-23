/**
 * Trusted-by page media — graded install still (usha poster; distinct from dmrc routes).
 * Hero video loops removed — poster-only LCP.
 */
export const TRUSTED_BY_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  alt: "Institutional workspace delivery by One and Only",
} as const;

/** Graded hero still (video loops removed). */
export const TRUSTED_BY_HERO_MEDIA = {
  poster: TRUSTED_BY_HERO_IMAGE.src,
} as const;

