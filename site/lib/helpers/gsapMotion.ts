import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginsRegistered = false;
let pageScrollerBound = false;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Phone marketing shell scrolls `.mobile-app-main`, not the window.
 * Using window as the ScrollTrigger scroller leaves from() at opacity 0 forever.
 */
export function gsapPageScroller(from?: Element | null): HTMLElement | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const root = from instanceof Element ? from : document.body;
  const main =
    root.closest?.(".mobile-app-main") ?? document.querySelector(".mobile-app-main");
  if (!(main instanceof HTMLElement)) {
    return undefined;
  }
  const overflowY = getComputedStyle(main).overflowY;
  if (overflowY !== "auto" && overflowY !== "scroll") {
    return undefined;
  }
  return main;
}

function syncPageScroller(): void {
  if (typeof window === "undefined") {
    return;
  }
  const scroller = gsapPageScroller();
  ScrollTrigger.defaults({ scroller: scroller ?? window });
}

/** Register GSAP plugins once (client-safe). */
export function registerGsapPlugins(): void {
  if (pluginsRegistered || typeof window === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
  syncPageScroller();
  if (!pageScrollerBound) {
    pageScrollerBound = true;
    window.addEventListener("resize", () => {
      syncPageScroller();
      ScrollTrigger.refresh();
    });
  }
}

/** Honor `prefers-reduced-motion: reduce` (parallax/scrub only). */
export function gsapReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** `useSyncExternalStore` subscription for reduced-motion preference. */
export function subscribeGsapReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

/** SSR snapshot: assume motion allowed so first paint is not frozen off. */
export function gsapReducedMotionServerSnapshot(): boolean {
  return false;
}

export const GSAP_EASE_OUT = "power3.out";
export const GSAP_EASE_IN_OUT = "power2.inOut";

export const GSAP_REVEAL = {
  y: 16,
  opacity: 1,
  duration: 0.7,
  stagger: 0.07,
} as const;

export const GSAP_SCROLL_REVEAL = {
  y: 16,
  opacity: 1,
  duration: 0.7,
  stagger: 0.07,
} as const;
