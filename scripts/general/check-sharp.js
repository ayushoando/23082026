const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const sitePackageJson = path.join(__dirname, "../..", "package.json");
const siteRequire = createRequire(sitePackageJson);
const trustedByPagePath = path.join(__dirname, "../..", "site/app/(site)/trusted-by/page.tsx");

try {
  const sharp = siteRequire("sharp");
  const versions = sharp.versions ?? {};
  const sharpVersion = versions.sharp ?? "unknown";
  const vipsVersion = versions.vips ?? "unknown";
  const trustedByPageSource = fs.readFileSync(trustedByPagePath, "utf8");
  const rosterKickerLines = trustedByPageSource
    .split("\n")
    .map((line, index) => (line.includes("rosterKicker=") ? index + 1 : null))
    .filter((line) => line !== null);

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/be88d5c5-6cda-4fd6-945a-b8e1c64da733", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6bcf28" }, body: JSON.stringify({ sessionId: "6bcf28", runId: "initial", hypothesisId: "H1,H2,H3,H4", location: "scripts/general/check-sharp.js:16", message: "Build preflight inspected trusted-by JSX", data: { sourceExists: true, rosterKickerAttributeCount: rosterKickerLines.length, rosterKickerLines }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion

  process.stdout.write(
    `sharp ok (${sharpVersion})` +
      (vipsVersion !== "unknown" ? ` using libvips ${vipsVersion}` : "") +
      "\n",
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `sharp missing or unusable in site workspace: ${message}\n`,
  );
  process.exit(1);
}
