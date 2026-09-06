import Script from "next/script";

// New Relic Browser (Pro + SPA). Loads the vendored agent from the same-origin
// route /newrelic.js, which injects the license key from a server env var.
// The agent only loads when NEW_RELIC_LICENSE_KEY is configured, mirroring the
// GoogleAnalytics env gate. No key is ever embedded in source or static files.
export function NewRelicScript({ nonce }: { nonce?: string }) {
  if (
    process.env.NODE_ENV === "test" ||
    !process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY
  ) {
    return null;
  }

  return (
    <Script
      id="newrelic-browser-agent"
      src="/newrelic.js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
