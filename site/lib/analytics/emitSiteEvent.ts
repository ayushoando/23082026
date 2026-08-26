/**
 * Lowest-level site-event emit primitive: consent gate + queue-or-send.
 *
 * Split out of siteEvents.ts so conversionContract.ts (which siteEvents.ts
 * itself depends on for trackConversionEvent) does not import back into
 * siteEvents.ts — that created a runtime circular dependency. Both
 * siteEvents.ts and conversionContract.ts import this module instead.
 */
import { hasAnalyticsConsent, hasConsentChoice } from "@/lib/consent";
import {
  enqueueSiteEvent,
  flushSiteEventQueue,
} from "@/lib/analytics/eventQueue";
import { sendAnalyticsEvent } from "@/lib/analytics/emitTransport";

type SiteEventPrimitive = string | number | boolean | null;
export type SiteEventPayload = Record<string, SiteEventPrimitive>;

export function emitSiteEvent(eventName: string, payload: SiteEventPayload) {
  if (typeof window === "undefined") {return;}
  if (!hasAnalyticsConsent()) {
    // Queue only while consent is undecided. Reject → drop (no analytics).
    // Queue until accept so first-page CTA/page_view are not lost forever.
    if (!hasConsentChoice()) {
      enqueueSiteEvent(eventName, payload);
    }
    return;
  }
  const ok = sendAnalyticsEvent(eventName, payload);
  if (!ok) {
    enqueueSiteEvent(eventName, payload);
  }
}

/** Call after consent accept so queued page_view / CTA events flush. */
export function flushAnalyticsAfterConsent(): void {
  if (typeof window === "undefined") {return;}
  if (!hasAnalyticsConsent()) {return;}
  flushSiteEventQueue();
}
