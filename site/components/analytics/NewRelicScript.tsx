// New Relic Browser Agent (Pro + SPA) - Account 8474489 / App 1134725588
export function NewRelicScript({ nonce }: { nonce?: string }) {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  return (
    <script
      id="newrelic-browser-agent"
      type="text/javascript"
      src="/newrelic.js"
      nonce={nonce}
      suppressHydrationWarning
    />
  );
}
