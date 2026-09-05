"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { hasAnalyticsConsent } from "@/lib/consent";

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

  if (!measurementId || process.env.NODE_ENV === "test" || !consentGranted) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics-tag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        nonce={nonce}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}', { page_path: window.location.pathname });`,
        }}
      />
    </>
  );
}
