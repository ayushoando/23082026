import Script from "next/script";

// New Relic Browser Agent (Pro + SPA) - Account 8474489 / App 1134725588
export function NewRelicScript({ nonce }: { nonce?: string }) {
  if (process.env.NODE_ENV === "test") {
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

