const path = require("path");
const { loadEnvLocal } = require(/* turbopackIgnore: true */ "../../scripts/general/loadEnvLocal.cjs");

loadEnvLocal();

const resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  process.env.URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/** Catalog photography is CDN-backed — not shipped in git (see scripts/downloadCdnAssets.ts). */
const DEFAULT_ASSET_CDN_BASE_URL = "https://oando.co.in";

const configuredAssetBaseUrl =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.ASSET_BASE_URL ||
  DEFAULT_ASSET_CDN_BASE_URL;

const parsedAssetBaseUrl = (() => {
  try {
    return configuredAssetBaseUrl ? new URL(configuredAssetBaseUrl) : null;
  } catch {
    return null;
  }
})();

// Image optimization flag — single source (the deleted COST-S01 module's logic
// was inlined here; the TS module was unwired dead code and removed 2026-09-02).
const imageOptFlag = process.env.NEXT_IMAGE_UNOPTIMIZED?.trim().toLowerCase();
const useUnoptimizedImages =
  imageOptFlag === "0" || imageOptFlag === "false"
    ? false
    : process.env.VERCEL_ENV === "production"
      ? true
      : imageOptFlag === "1" || imageOptFlag === "true";

const firstPartyAssetHost = process.env.NEXT_PUBLIC_ASSET_HOSTNAME?.trim();

const imageRemotePatterns = [
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

if (firstPartyAssetHost) {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: firstPartyAssetHost,
    pathname: "/**",
  });
}

if (parsedAssetBaseUrl) {
  const normalizedBasePath = parsedAssetBaseUrl.pathname.replace(/\/+$/, "");
  imageRemotePatterns.push({
    protocol: parsedAssetBaseUrl.protocol.replace(":", ""),
    hostname: parsedAssetBaseUrl.hostname,
    pathname: `${normalizedBasePath || ""}/**`,
  });
}

const fs = require("fs");

const findRepoRoot = (dir) => {
  if (fs.existsSync(path.join(/* turbopackIgnore: true */ dir, "node_modules", "next"))) return dir;
  const parent = path.dirname(dir);
  return parent === dir ? dir : findRepoRoot(parent);
};

// Live interactive apps = /oostudio + /ooplanner (forked from product-studio + planner).
// Do not reintroduce deleted product-studio or monorepo /planner app trees.

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  agentRules: false,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_SITE_URL: resolvedSiteUrl,
    NEXT_PUBLIC_ASSET_BASE_URL: configuredAssetBaseUrl,
  },
  trailingSlash: true,
  async redirects() {
    return [
      // Hard 308/301 for crawlers — do not rely on page-level redirect() (soft 200 in dev).
      { source: "/solutions", destination: "/products/", permanent: true },
      { source: "/solutions/", destination: "/products/", permanent: true },
      { source: "/solutions/:category", destination: "/products/:category/", permanent: true },
      { source: "/solutions/:category/", destination: "/products/:category/", permanent: true },
      { source: "/catalog", destination: "/downloads/", permanent: true },
      { source: "/catalog/", destination: "/downloads/", permanent: true },
      { source: "/brochure", destination: "/downloads/", permanent: true },
      { source: "/brochure/", destination: "/downloads/", permanent: true },
      { source: "/download-brochure", destination: "/downloads/", permanent: true },
      { source: "/download-brochure/", destination: "/downloads/", permanent: true },
      { source: "/templates", destination: "/products/", permanent: true },
      { source: "/templates/", destination: "/products/", permanent: true },
      { source: "/news", destination: "/about/", permanent: true },
      { source: "/news/", destination: "/about/", permanent: true },
      // Legacy client logo filenames (renamed to kebab-case) — 308 permanent redirect
      { source: "/assets/marketing/client-logos/AmbujaNeotia.png", destination: "/assets/marketing/client-logos/ambuja-neotia.png", permanent: true },
      { source: "/assets/marketing/client-logos/AnnapurnaMicroFinance.jpg", destination: "/assets/marketing/client-logos/annapurna-finance.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/BIS.jpg", destination: "/assets/marketing/client-logos/bureau-of-indian-standards.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/BSPHCL.jpg", destination: "/assets/marketing/client-logos/bsphcl.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/BiharGovernment.jpg", destination: "/assets/marketing/client-logos/government-of-bihar.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/CanaraBank.jpg", destination: "/assets/marketing/client-logos/canara-bank.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/CorporationBank.jpg", destination: "/assets/marketing/client-logos/corporation-bank.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/CRIPumps.jpg", destination: "/assets/marketing/client-logos/cri-pumps.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/CustomsandCentralExcise.jpg", destination: "/assets/marketing/client-logos/customs-and-central-excise.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/EsselUtilities.jpg", destination: "/assets/marketing/client-logos/essel-utilities.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/FHI360.png", destination: "/assets/marketing/client-logos/fhi-360.png", permanent: true },
      { source: "/assets/marketing/client-logos/FranklinTempleton.jpg", destination: "/assets/marketing/client-logos/franklin-templeton.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/GDGoenka.jpg", destination: "/assets/marketing/client-logos/gd-goenka.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/GOILogo.jpg", destination: "/assets/marketing/client-logos/iocl.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/HDFCLogo.jpg", destination: "/assets/marketing/client-logos/hdfc-limited.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/HyundaiLogo.jpg", destination: "/assets/marketing/client-logos/hyundai-limited.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/IDBIBankLogo.png", destination: "/assets/marketing/client-logos/idbi-bank.png", permanent: true },
      { source: "/assets/marketing/client-logos/IncomeTaxdepartment.png", destination: "/assets/marketing/client-logos/income-tax-department.png", permanent: true },
      { source: "/assets/marketing/client-logos/JSW.png", destination: "/assets/marketing/client-logos/jsw.png", permanent: true },
      { source: "/assets/marketing/client-logos/LandT.png", destination: "/assets/marketing/client-logos/l-and-t-finance-limited.png", permanent: true },
      { source: "/assets/marketing/client-logos/MECON.jpg", destination: "/assets/marketing/client-logos/mecon-limited.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/MarutiSuzuki.png", destination: "/assets/marketing/client-logos/maruti-suzuki-limited.png", permanent: true },
      { source: "/assets/marketing/client-logos/ParadeepPhospates.jpg", destination: "/assets/marketing/client-logos/paradeep-phosphates.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/SAIL.png", destination: "/assets/marketing/client-logos/steel-authority-of-india-limited.png", permanent: true },
      { source: "/assets/marketing/client-logos/SITICable.png", destination: "/assets/marketing/client-logos/siti-networks.png", permanent: true },
      { source: "/assets/marketing/client-logos/ShriramTransportFianance.png", destination: "/assets/marketing/client-logos/shriram-commercial-vehicle-finance.png", permanent: true },
      { source: "/assets/marketing/client-logos/Sonalika.jpg", destination: "/assets/marketing/client-logos/sonalika.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/SurveyofIndia.jpg", destination: "/assets/marketing/client-logos/survey-of-india.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/SyndicateBank.png", destination: "/assets/marketing/client-logos/syndicate-bank-limited.png", permanent: true },
      { source: "/assets/marketing/client-logos/TataMotors.jpg", destination: "/assets/marketing/client-logos/tata-motors.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/Titan.png", destination: "/assets/marketing/client-logos/titan-limited.png", permanent: true },
      { source: "/assets/marketing/client-logos/USHA.png", destination: "/assets/marketing/client-logos/usha-international-ltd.png", permanent: true },
      { source: "/assets/marketing/client-logos/UjjivanBank.jpg", destination: "/assets/marketing/client-logos/ujjivan-small-finance-bank.jpg", permanent: true },
      { source: "/assets/marketing/client-logos/UnitedBankofIndia.png", destination: "/assets/marketing/client-logos/united-bank-limited.png", permanent: true },
      { source: "/gallery", destination: "/portfolio/", permanent: true },
      { source: "/gallery/", destination: "/portfolio/", permanent: true },
      { source: "/projects", destination: "/portfolio/", permanent: true },
      { source: "/projects/", destination: "/portfolio/", permanent: true },
      { source: "/social", destination: "/portfolio/", permanent: true },
      { source: "/social/", destination: "/portfolio/", permanent: true },
      // Query param — HTTP redirects cannot reliably preserve URL fragments (#imprint).
      { source: "/imprint", destination: "/terms/?section=imprint", permanent: true },
      { source: "/imprint/", destination: "/terms/?section=imprint", permanent: true },
      { source: "/support-ivr", destination: "/service/", permanent: true },
      { source: "/support-ivr/", destination: "/service/", permanent: true },
      { source: "/tracking", destination: "/service/", permanent: true },
      { source: "/tracking/", destination: "/service/", permanent: true },
      { source: "/login", destination: "/access/", permanent: true },
      { source: "/login/", destination: "/access/", permanent: true },
      { source: "/planner/features/3d-view", destination: "/planner/features/export/", permanent: true },
      { source: "/planner/features/3d-view/", destination: "/planner/features/export/", permanent: true },
      // Legacy Product Studio URLs — fork has no /admin/product-studio tree; canonical /oostudio/
      { source: "/admin/svg-editor", destination: "/oostudio/", permanent: true },
      { source: "/admin/svg-editor/", destination: "/oostudio/", permanent: true },
      { source: "/admin/svg-editor/parametric", destination: "/oostudio/", permanent: true },
      { source: "/admin/svg-editor/parametric/", destination: "/oostudio/", permanent: true },
      { source: "/admin/svg-editor/:id", destination: "/oostudio/", permanent: true },
      { source: "/admin/svg-editor/:id/", destination: "/oostudio/", permanent: true },
      { source: "/admin/product-studio", destination: "/oostudio/", permanent: true },
      { source: "/admin/product-studio/", destination: "/oostudio/", permanent: true },
      { source: "/admin/product-studio/:path*", destination: "/oostudio/", permanent: true },
      // Phase 7 Stage B — retired portal SVG catalog (routes deleted; permanent 308 only).
      { source: "/portal/svg-catalog", destination: "/products/", permanent: true },
      { source: "/portal/svg-catalog/", destination: "/products/", permanent: true },
      { source: "/portal/svg-catalog/:slug", destination: "/products/", permanent: true },
      { source: "/portal/svg-catalog/:slug/", destination: "/products/", permanent: true },
      // Legacy category alias — hard 308 (avoid soft permanentRedirect shells).
      { source: "/products/category/:slug", destination: "/products/:slug/", permanent: true },
      { source: "/products/category/:slug/", destination: "/products/:slug/", permanent: true },
      {
        source: "/results",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/results/:path*",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/workstations/configurator",
        destination: "/downloads/",
        permanent: true,
      },
      {
        source: "/products/oando-chairs",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/oando-chairs/:slug",
        destination: "/products/seating/:slug",
        permanent: true,
      },
      {
        source: "/products/oando-other-seating",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/oando-other-seating/:slug",
        destination: "/products/seating/:slug",
        permanent: true,
      },
      {
        source: "/products/oando-seating",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/oando-workstations",
        destination: "/products/workstations",
        permanent: true,
      },
      {
        source: "/products/oando-tables",
        destination: "/products/tables",
        permanent: true,
      },
      {
        source: "/products/oando-storage",
        destination: "/products/storages",
        permanent: true,
      },
      {
        source: "/products/oando-soft-seating",
        destination: "/products/soft-seating",
        permanent: true,
      },
      {
        source: "/products/oando-collaborative",
        destination: "/products/soft-seating",
        permanent: true,
      },
      {
        source: "/products/oando-educational",
        destination: "/products/education",
        permanent: true,
      },
      {
        source: "/products/chairs-mesh",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/chairs-others",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/cafe-seating",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/desks-cabin-tables",
        destination: "/products/tables",
        permanent: true,
      },
      {
        source: "/products/meeting-conference-tables",
        destination: "/products/tables",
        permanent: true,
      },
      {
        source: "/products/others-1",
        destination: "/products/soft-seating",
        permanent: true,
      },
      {
        source: "/products/others-2",
        destination: "/products/seating",
        permanent: true,
      },
      // Legacy oando-planner / monorepo planner URLs → forked /ooplanner/
      { source: "/oando-planner", destination: "/ooplanner/", permanent: true },
      { source: "/oando-planner/canvas", destination: "/ooplanner/", permanent: true },
      { source: "/oando-planner/guest", destination: "/ooplanner/", permanent: true },
      { source: "/oando-planner/onboarding", destination: "/ooplanner/", permanent: true },
      { source: "/oando-planner/dashboard", destination: "/dashboard/", permanent: true },
      { source: "/oando-planner/shared", destination: "/ooplanner/", permanent: true },
      { source: "/oando-planner/login", destination: "/login/", permanent: true },
      { source: "/oando-planner/:path*", destination: "/ooplanner/", permanent: true },
      // Legacy workspace planner URLs → forked /ooplanner/ (marketing /planner/* pages stay in app/(site)/planner)
      { source: "/planner/guest", destination: "/ooplanner/", permanent: true },
      { source: "/planner/guest/:path*", destination: "/ooplanner/", permanent: true },
      { source: "/planner/canvas", destination: "/ooplanner/", permanent: true },
      { source: "/planner/canvas/:path*", destination: "/ooplanner/", permanent: true },
      { source: "/planner/fabric", destination: "/ooplanner/", permanent: true },
      { source: "/planner/fabric/:path*", destination: "/ooplanner/", permanent: true },
      { source: "/planner/open3d", destination: "/ooplanner/", permanent: true },
      { source: "/planner/open3d/:path*", destination: "/ooplanner/", permanent: true },
      // Preserve project deep links before any legacy catch-all
      { source: "/planner/projects/:id", destination: "/ooplanner/projects/:id/", permanent: true },
      { source: "/planner/projects/:id/", destination: "/ooplanner/projects/:id/", permanent: true },
      { source: "/planner/projects", destination: "/ooplanner/projects/", permanent: true },
      { source: "/planner/projects/", destination: "/ooplanner/projects/", permanent: true },
      // Legacy buddy-planner URLs (archived)
      { source: "/buddy-planner", destination: "/ooplanner/", permanent: true },
      { source: "/buddy-planner/guest", destination: "/ooplanner/", permanent: true },
      { source: "/buddy-planner/editor", destination: "/ooplanner/", permanent: true },
      { source: "/buddy-planner/:path*", destination: "/ooplanner/", permanent: true },
      // Legacy CRM / ops portals (canonical: /admin/crm, /admin/customer-queries)
      { source: "/crm", destination: "/admin/crm/", permanent: true },
      { source: "/crm/:path*", destination: "/admin/crm/:path*", permanent: true },
      { source: "/ops", destination: "/admin/customer-queries/", permanent: true },
      { source: "/ops/customer-queries", destination: "/admin/customer-queries/", permanent: true },
      { source: "/ops/customer-queries/:path*", destination: "/admin/customer-queries/", permanent: true },
      { source: "/ops/:path*", destination: "/admin/customer-queries/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'"
          }
        ]
      },
      {
        source: "/tech-docs/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow"
          }
        ]
      },
      // RFC 8288 & RFC 9727 Section 3 Link response headers on homepage for agent discovery
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: [
              '</.well-known/api-catalog>; rel="api-catalog"',
              '</.well-known/agent-card.json>; rel="service-desc"',
              '</auth.md>; rel="service-doc"',
              '</.well-known/agent-skills/index.json>; rel="describedby"',
            ].join(", "),
          },
        ],
      },
      // Agent Discovery documents MIME and CORS headers
      {
        source: "/.well-known/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      // Extensionless .well-known endpoints require application/json per RFCs
      {
        source: "/.well-known/api-catalog",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/.well-known/oauth-protected-resource",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/.well-known/oauth-authorization-server",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/.well-known/openid-configuration",
        headers: [
          {
            key: "Content-Type",
            value: "application/json; charset=utf-8",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      // auth.md & agent skills headers
      {
        source: "/auth.md",
        headers: [
          {
            key: "Content-Type",
            value: "text/markdown; charset=utf-8",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/skills/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      }
    ];
  },
  async rewrites() {
    return {
      // Legacy Product Studio API path → forked Studio furniture API (Fabric v7 app).
      // List/create live at /api/Studio/furniture; subpaths (draft/lifecycle) are gone —
      // clients should use /oostudio Save + admin catalog.
      beforeFiles: [
        // Catalog photography — local dev serves from R2 when not on CDN origin.
        {
          source: "/assets/catalog/:path*",
          destination: "/api/files/catalog/:path*",
        },
        // assets/others cutover — keep legacy public URL roots working
        { source: "/vendor/:path*", destination: "/assets/others/vendor/:path*" },
        { source: "/cdn/:path*", destination: "/assets/others/legacy/cdn/:path*" },
        { source: "/svg-catalog/:path*", destination: "/assets/others/legacy/svg-catalog/:path*" },
        { source: "/png-catalog/:path*", destination: "/assets/others/legacy/png-catalog/:path*" },
        { source: "/catalog-assets/:path*", destination: "/assets/others/legacy/catalog-assets/:path*" },
        { source: "/fonts/:path*", destination: "/assets/others/fonts/:path*" },
        { source: "/placeholder-:name.svg", destination: "/assets/others/placeholders/placeholder-:name.svg" },
        { source: "/proof-chair.svg", destination: "/assets/others/placeholders/proof-chair.svg" },
        { source: "/planner-icons.svg", destination: "/assets/others/icons/planner-icons.svg" },
        { source: "/sw.js", destination: "/assets/others/system/sw.js" },
        { source: "/manifest.json", destination: "/assets/others/system/manifest.json" },
        { source: "/logo-blue-horizontal.webp", destination: "/assets/others/logos/logo-blue-horizontal.webp" },
        { source: "/catalog-logo-sharp.svg", destination: "/assets/others/logos/catalog-logo-sharp.svg" },
        { source: "/catalog-logo-sharp.webp", destination: "/assets/others/logos/catalog-logo-sharp.webp" },
        {
          source: "/api/admin/svg-editor",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/svg-editor/",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/svg-editor/furniture",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/svg-editor/furniture/:path*",
          destination: "/api/Studio/furniture/:path*",
        },
        {
          source: "/api/admin/svg-editor/:path*",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/product-studio",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/product-studio/",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/product-studio/furniture",
          destination: "/api/Studio/furniture",
        },
        {
          source: "/api/admin/product-studio/furniture/:path*",
          destination: "/api/Studio/furniture/:path*",
        },
        {
          source: "/api/admin/product-studio/:path*",
          destination: "/api/Studio/furniture",
        },
      ],
      afterFiles: [
        // Tech stack docs SPA — catch-all for client-side routes
        {
          source: '/tech-docs/:path*',
          destination: '/tech-docs/index.html',
        },
      ],
    };
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    unoptimized: useUnoptimizedImages,
    remotePatterns: imageRemotePatterns,
    // Raster-only via next/image. SVG catalog assets load as static files / <img>, not Image optimizer.
    dangerouslyAllowSVG: false,
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
    // Cloudflare terminates the public request before forwarding it to Vercel,
    // so Next can observe a different X-Forwarded-Host than the browser Origin.
    // Keep the allowlist to the canonical public origin; this preserves Next's
    // Server Action CSRF check while allowing forms served from oando.co.in.
    serverActions: {
      allowedOrigins: ["oando.co.in"],
    },
    useTypeScriptCli: true, // TypeScript 7 uses the project-local tsc CLI (no JS compiler API)
  },
  // Native binary / dynamic-require packages — do not bundle into Turbopack/webpack graph.
  serverExternalPackages: ["sharp", "@lancedb/lancedb", "@mastra/core"],
  typescript: {
    ignoreBuildErrors: false, // PERF-FIX: enforce type safety at build time
  },
  webpack: (config, { isServer }) => {
    const repoRoot = findRepoRoot(/* turbopackIgnore: true */ __dirname);
    const focssRoot = path.join(repoRoot, "site", "focss");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@focss": focssRoot,
      "@focss/": `${focssRoot}/`,
      "@oando/focss": focssRoot,
      "@oando/focss/": `${focssRoot}/`,
    };
    // Client bundles must not pull node:fs (e.g. gltf-transform NodeIO via modular GLB path).
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
  // Prefer site package.json "dev"/"build": --webpack (turbo optional via dev:turbo).
  // turbopack.root at monorepo root indexes huge node_modules — memory risk.
  turbopack: {
    root: findRepoRoot(/* turbopackIgnore: true */ __dirname),
    resolveAlias: {
      "@focss": "./site/focss",
      "@focss/": "./site/focss/",
      "@oando/focss": "./site/focss",
      "@oando/focss/": "./site/focss/",
    },
  },
};

module.exports = nextConfig;
