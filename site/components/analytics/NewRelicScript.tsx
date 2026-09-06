import Script from "next/script";

// New Relic Browser (Pro + SPA). Loads the vendored agent from the same-origin
// route /newrelic.js, which injects the license key from a server env var.
// The agent only loads when NEW_RELIC_BROWSER_KEY is configured, mirroring the
// GoogleAnalytics env gate. No key is ever embedded in source or static files.
// Privacy trade-off: timing and error metadata are collected, while payloads and
// headers remain excluded to avoid capturing credentials or request content.
export function NewRelicScript({ nonce }: { nonce?: string }) {
  const browserKey = process.env.NEW_RELIC_BROWSER_KEY;

  if (process.env.NODE_ENV === "test" || !browserKey) {
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
