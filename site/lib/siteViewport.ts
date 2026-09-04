import type { Viewport } from "next";

/** Shared mobile viewport + light browser chrome color. */
export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "var(--color-white-50)",
};
