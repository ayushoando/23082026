import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pluginsRegistered = false;
let pageScrollerBound = false;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Matches `app-shell.css` phone layout: `width < theme(--breakpoint-md)` (768px). */
const PHONE_LAYOUT_QUERY = "(width < 768px)";

function isPhoneLayout(): boolean {
  return typeof window !== "undefined" && window.matchMedia(PHONE_LAYOUT_QUERY).matches;
}

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
  if (overflowY === "auto" || overflowY === "scroll") {
    return main;
  }
  // Overflow may not be computed yet; phone layout still scrolls this pane.
  if (isPhoneLayout()) {
    return main;
  }
  return undefined;
}

export function syncPageScroller(): void {
  if (typeof window === "undefined") {
    return;
  }
  const scroller = gsapPageScroller();
  ScrollTrigger.defaults({ scroller: scroller ?? window });
}

/** Register GSAP plugins once (client-safe). Re-syncs the page scroller on every call. */
export function registerGsapPlugins(refreshTriggers = false): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    pluginsRegistered = true;
  }
  syncPageScroller();
  if (!pageScrollerBound) {
    pageScrollerBound = true;
    const onViewport = () => {
      syncPageScroller();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onViewport);
    window.matchMedia(PHONE_LAYOUT_QUERY).addEventListener("change", onViewport);
  }
  if (refreshTriggers) {
    ScrollTrigger.refresh();
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
