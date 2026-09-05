"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { hasAnalyticsConsent } from "@/lib/consent";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener("oando-cookie-consent", onStoreChange);
  return () => window.removeEventListener("oando-cookie-consent", onStoreChange);
}

// Google Analytics 4 (GA4) Tag - Measurement ID: G-CTPK6318CR
export function GoogleAnalytics({
  gaId,
  nonce,
}: {
  gaId?: string;
  nonce?: string;
}) {
  // Same gate as `getGtmScriptSources()` in site/proxy.ts — do not hardcode a
  // property ID or gtag will load without a matching script-src origin.
  const measurementId = gaId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const consentGranted = useSyncExternalStore(
    subscribeToConsent,
    hasAnalyticsConsent,
    () => false,
  );

  useEffect(() => {
    if (!measurementId || process.env.NODE_ENV === "test" || !consentGranted) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer ??= [];
    analyticsWindow.gtag ??= (...args: unknown[]) => {
      analyticsWindow.dataLayer?.push(args);
    };
    analyticsWindow.gtag("js", new Date());
    analyticsWindow.gtag("config", measurementId, {
      page_path: window.location.pathname,
    });
  }, [consentGranted, measurementId]);

  if (!measurementId || process.env.NODE_ENV === "test" || !consentGranted) {
    return null;
  }

  return (
    <Script
      id="google-analytics-tag"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      nonce={nonce}
    />
  );
}
