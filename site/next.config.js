const createNextIntlPlugin = require("next-intl/plugin");
const path = require("path");

// Load monorepo-root `.env.local` before Next's project-dir env load.
require("../scripts/general/loadEnvLocal.cjs").loadEnvLocal();

// Default next-intl path. Needed at repo-root cwd (`next build site` validates
// against process.cwd()) via root `i18n/request.ts` re-export, and under the
// `site/` app dir as the real module. Do not use `./site/i18n/...` here — when
// Next's webpack context is already `site/`, that doubles the prefix.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const baseConfig = require("../config/build/next.config.js");

const HOME_REDIRECT_SOURCES = new Set([
  "/news",
  "/news/",
  "/brochure",
  "/brochure/",
  "/download-brochure",
  "/download-brochure/",
  "/catalog",
  "/catalog/",
]);

const monorepoRoot = path.join(/* turbopackIgnore: true */ __dirname, "..");

const SECURITY_HEADERS = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' blob: https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://static.cloudflareinsights.com https://js-agent.newrelic.com https://www.googletagmanager.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' data: https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.openai.com https://openrouter.ai https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://static.cloudflareinsights.com https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://bam.nr-data.net https://*.nr-data.net",
      "frame-src 'self' https://www.google.com https://maps.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

// Merge experimental so fork-required TypeScript 7 CLI flag cannot be dropped
// if baseConfig.experimental is ever slimmed.
const experimental = {
  ...(baseConfig.experimental),
  useTypeScriptCli: true,
};

module.exports = withNextIntl({
  ...baseConfig,
  experimental,
  async redirects() {
    const redirects = await baseConfig.redirects();
    return redirects.map((redirect) =>
      HOME_REDIRECT_SOURCES.has(redirect.source)
        ? { ...redirect, destination: "/" }
        : redirect,
    );
  },
  async headers() {
    const baseHeaders = typeof baseConfig.headers === "function" ? await baseConfig.headers() : [];
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      ...baseHeaders.filter((entry) => entry.source !== "/api/:path*"),
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  // Optional isolated distDir for quiet multi-agent probes (e.g. OANDO_NEXT_DIST=.next-3010).
  // Unset → default `.next` (shared with the primary `pnpm run dev` on :3000).
  ...(process.env.OANDO_NEXT_DIST
    ? { distDir: process.env.OANDO_NEXT_DIST }
    : {}),
  // NFT still monorepo-aware; default dev is webpack (see package.json "dev").
  // turbo (dev:turbo) inherits baseConfig.turbopack — use sparingly (RAM risk).
  outputFileTracingRoot: monorepoRoot,
});
