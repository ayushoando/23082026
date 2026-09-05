import Script from "next/script";

// Google Analytics 4 (GA4) Tag - Measurement ID: G-CTPK6318CR
export function GoogleAnalytics({
  gaId,
  nonce,
}: {
  gaId?: string;
  nonce?: string;
}) {
  const measurementId =
    gaId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-CTPK6318CR";

  if (!measurementId || process.env.NODE_ENV === "test") {
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

