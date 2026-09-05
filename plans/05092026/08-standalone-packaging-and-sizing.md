# Oando Subsystem Remediation Plan: Standalone Packaging, Asset Footprint, and Bundle Sizing

**File Target:** `plans/05092026/08-standalone-packaging-and-sizing.md`  
**Governing Standard:** `AGENTS.md` (Authority floor: User instruction > live code/fresh command output > `AGENTS.md`)  
**Execution State:** **IN PROGRESS.** `build:site` exit 0 this session. `start:standalone` unrun.  
**Methodology:** Next.js Standalone Build Optimization, Serverless Distribution Footprint, Catalog Symbol Raster Specifications, and Native Package Externalization.

## Execution checklist (leave open)

- [x] `output: "standalone"`; `prepare-standalone.cjs` on `build:site`
- [x] `serverExternalPackages` includes sharp, lancedb, mastra
- [x] `pnpm run build:site` exit 0; `server.js` + static + public + generate-svg in standalone
- [ ] `start:standalone` not run
- [x] `planSymbolPngContract` unit test 4/4
- [ ] `@lancedb/lancedb` not in this NFT trace
- [ ] Isolated standalone deep-link boot unrun

---

## 1. Subsystem Overview & Packaging Topology

The Oando production build pipeline compiles the monolithic Next.js application into a self-contained, minimal standalone deployment artifact, isolates native binary dependencies, and enforces strict asset sizing contracts.

```
┌────────────────────────────────────────────────────────────────────────┐
│              OANDO STANDALONE PACKAGING & ASSET ARCHITECTURE           │
├────────────────────────────────────────────────────────────────────────┤
│                       Next.js Standalone Engine                        │
│                config/build/next.config.js (output: "standalone")       │
│ • Traces exact node_modules dependencies via Next NFT engine           │
│ • Omits development dependencies, test harnesses, and doc tools        │
├────────────────────────────────────────────────────────────────────────┤
│                     Standalone Asset Post-Processor                    │
│                 scripts/general/prepare-standalone.cjs                 │
│ • Copies site/.next/static ──► standalone/.next/static                 │
│ • Copies site/public       ──► standalone/public                       │
│ • Bundles scripts/generate-svg/ for serverless SVG plan generation     │
├────────────────────────────────────────────────────────────────────────┤
│                      Native Binary Externalization                     │
│   serverExternalPackages: ["sharp", "@lancedb/lancedb", "@mastra/core"]│
│   • Prevents Webpack compilation of native C++ / Rust .node bindings   │
│   • Client resolve fallbacks: fs, path, crypto, stream, buffer ──► false│
├────────────────────────────────────────────────────────────────────────┤
│                      Catalog Symbol Raster Contract                    │
│                 site/lib/catalog/planSymbolPngContract.ts              │
│ • Locked Scale: 2.0 px/mm  • Transparent Padding: 40 mm (80px)        │
│ • Format: image/png        • SHA-256 Checksum Validation               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Next.js Standalone Distribution Pipeline

### Build Configuration (`config/build/next.config.js#L79`)
The production application sets `output: "standalone"`, instructing Next.js to use Node File Trace (NFT) to analyze all `import` and `require` statements and assemble an isolated server footprint.

### Asset Copy Automation (`scripts/general/prepare-standalone.cjs`)
Because Next.js standalone does not automatically bundle the static client bundles or public assets into the serverless output root, `prepare-standalone.cjs` executes automatically during `pnpm run build:site`:

1. **Static Client Chunks:**
   - Source: `site/.next/static`
   - Destination 1: `site/.next/standalone/.next/static`
   - Destination 2: `site/.next/standalone/site/.next/static` (handles nested root resolution).
2. **Public Assets:**
   - Source: `site/public`
   - Destination 1: `site/.next/standalone/public`
   - Destination 2: `site/.next/standalone/site/public`.
3. **Dynamic SVG Generation Fixtures:**
   - Copies `scripts/generate-svg.mjs` and `scripts/generate-svg/_fixtures` into the standalone bundle to enable dynamic SVG symbol rendering in serverless environments without requiring root repository access.

### Standalone Server Booting (`scripts/general/startStandalone.cjs`)
The production entrypoint handles environment bootstrap and server execution:
- Evaluates candidate paths for `server.js` (`site/.next/standalone/site/server.js`, `site/.next/standalone/server.js`).
- Pre-loads local environment variables using `scripts/general/loadEnvLocal.cjs`.
- Binds to `PORT=3000` on `0.0.0.0` or `localhost`.

---

## 3. Webpack & Native Package Externalization

To avoid bundling native C++/Rust binaries into Webpack bundles or causing client runtime crashes, strict externalization rules are configured in [`config/build/next.config.js`](file:///d:/23082026/config/build/next.config.js).

### External Server Packages (`next.config.js#L409`)
```javascript
serverExternalPackages: ["sharp", "@lancedb/lancedb", "@mastra/core"]
```
- **`sharp`:** High-performance libvips image manipulation. Must remain external to preserve platform-specific precompiled binaries.
- **`@lancedb/lancedb`:** Native embedded vector database with compiled `.node` binaries for Vectorize bridge and local indexing.
- **`@mastra/core`:** AI agent orchestration engine requiring direct Node filesystem and runtime introspection.

### Client Bundle Fallbacks (`next.config.js#L425-L433`)
Client-side Webpack resolution disables Node core modules to prevent bundle bloat and browser crashes:
```javascript
config.resolve.fallback = {
  ...config.resolve.fallback,
  fs: false,
  path: false,
  crypto: false,
  stream: false,
  buffer: false,
};
```

### Bundle Optimizations
- **Package Import Optimization:**
  `experimental.optimizePackageImports: ["@phosphor-icons/react", "framer-motion"]` ensures tree-shaking pulls in only referenced icons and motion primitives.
- **TypeScript CLI Mode:**
  `experimental.useTypeScriptCli: true` compiles with local TypeScript 7 CLI, avoiding deprecated in-process compiler APIs.

---

## 4. Plan Symbol PNG Sizing Contract

Defined in [`site/lib/catalog/planSymbolPngContract.ts`](file:///d:/23082026/site/lib/catalog/planSymbolPngContract.ts), catalog plan symbols adhere to strict mathematical scale and padding invariants:

```typescript
export const PLAN_SYMBOL_PX_PER_MM = 2 as const;
export const PLAN_SYMBOL_PAD_MM = 40 as const;
export const PLAN_SYMBOL_MIME = "image/png" as const;
export const PNG_CATALOG_PUBLIC_PATH = "/png-catalog" as const;
export const PLANNER_SYMBOLS_STORAGE_PREFIX = "planner-symbols" as const;

export const PLAN_SYMBOL_PNG_FIELD = {
  url: "planSymbolPngUrl",
  checksum: "planSymbolPngChecksum",
  mime: "planSymbolMime",
} as const;
```

### Raster Geometry & Calculations
- **Core Footprint:**
  $$\text{coreWidthPx} = \text{round}(\text{widthMm} \times 2)$$
  $$\text{coreHeightPx} = \text{round}(\text{depthMm} \times 2)$$
- **Raster Dimensions (with 40mm padding on all 4 sides):**
  $$\text{rasterWidthPx} = \text{coreWidthPx} + 2 \times (40 \times 2) = \text{coreWidthPx} + 160$$
  $$\text{rasterHeightPx} = \text{coreHeightPx} + 2 \times (40 \times 2) = \text{coreHeightPx} + 160$$
- **Example Calculation:**
  - Executive Desk: $1600\,\text{mm} \times 800\,\text{mm}$
  - Core Pixels: $3200\,\text{px} \times 1600\,\text{px}$
  - Final Raster Pixels: $3360\,\text{px} \times 1760\,\text{px}$
- **Integrity Validation:**
  Every published symbol must generate a SHA-256 checksum matching `/^[a-f0-9]{64}$/` to verify byte immutability across CDN caches.

---

## 5. Tech-Docs SPA Bundle & Production Integration

- **Dedicated Output Directory:** Builds directly to `generated-documents/site/` via `getSiteOutputRoot(repoRoot)` in `tech-docs-generator/scripts/output-contract.mjs`.
- **Cache Isolation:** Uses `results/tooling/tech-docs/vite-cache/` to prevent polluting Git workspace.
- **Production Routing Rewrite:** Configured in `config/build/next.config.js#L387-L393`:
  ```javascript
  {
    source: "/tech-docs/:path*",
    destination: "/tech-docs/index.html",
  }
  ```
  In production, Next.js delegates `/tech-docs` routes directly to the built static SPA.

---

## 6. Verification & Packaging Runbook

### Authorized Standalone & Build Verification Commands
```bash
# Build the production Next.js site and assemble standalone artifacts
pnpm run build:site

# Verify standalone server boots cleanly (runs startStandalone.cjs)
pnpm run start:standalone

# Build Tech-Docs SPA static distribution
pnpm run tech-docs:build

# Verify symbol PNG contract via unit tests
pnpm vitest run tests/unit/lib/catalog/planSymbolPngContract.test.ts
```

### Standalone Build Preflight Checklist
1. Verify that `site/.next/standalone` contains `server.js`, `.next/static`, and `public`.
2. Verify that `scripts/generate-svg` is copied into the standalone distribution.
3. Confirm that no native `.node` binaries are packaged into client chunks.
4. Ensure all symbol PNG dimensions adhere to the $2\,\text{px/mm} + 160\,\text{px}$ padding formula.
## Test reconciliation update (2026-09-05)

### Detailed work packages: reproducibility and artifact membership

1. Specify build identity: revision, dirty-tree scope, lockfile, runtime/package-manager versions and declared build inputs. Do not use historical bundle sizes as current measurements.
2. Produce an intended artifact-membership checklist: server entry, static assets, public assets, required native dependencies and separate Tech-Docs output. Distinguish required runtime assets from fixtures, baselines and generated test evidence.
3. Define cold-start and representative deep-link checks for an authorized isolated artifact run. A successful development server is not evidence of standalone completeness.
4. Compare like-for-like size measurements: compressed transfer, emitted client bytes and server distribution bytes separately. Set budgets only after collecting an approved baseline.
5. Inspect environment consumption by name at build/runtime boundaries; ensure the planned artifact review cannot print or publish secret values.

Deliverable: artifact manifest and reproducible comparison procedure. Acceptance: required assets resolve from the artifact, unnecessary test evidence is identified without blind deletion, and rollback retains the previously approved artifact.

Keep baseline images and fixtures separate from disposable captures. Inspect standalone artifact membership after relocation before claiming tests are excluded or package size has improved.

Acceptance: record current path, owner, destination/disposition, preserved assertions, affected commands, and evidence. A filename or age alone is insufficient grounds for retirement. Runtime validation remains pending; this update changes planning documents only.
