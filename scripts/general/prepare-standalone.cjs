/**
 * Copy .next/static and public/ into the Next.js standalone output directory.
 * Required when next.config sets output: "standalone" (DigitalOcean / bare-metal).
 *
 * Product app lives under site/; monorepo scripts/ at repo root.
 * Also copies scripts/generate-svg.mjs plus scripts/generate-svg/ (pipeline + fixtures)
 * and writes artifact-membership.json (paths, sizes, env names — never secret values).
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const NATIVE_PACKAGES = ["sharp", "@lancedb/lancedb", "@mastra/core"];
const BUILD_RUNTIME_ENV_NAMES = [
  "NODE_ENV",
  "PORT",
  "DEV_AUTH_BYPASS",
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "URL",
  "VERCEL_URL",
  "VERCEL_ENV",
  "NEXT_PUBLIC_ASSET_BASE_URL",
  "ASSET_BASE_URL",
  "NEXT_IMAGE_UNOPTIMIZED",
  "NEXT_PUBLIC_ASSET_HOSTNAME",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PRODUCTS_DATABASE_URL",
  "SUPABASE_AUTH_DATABASE_URL",
];
const ISOLATED_DEEP_LINKS = ["/", "/ooplanner/", "/oostudio/", "/products/"];
const DIRTY_PATH_CAP = 50;

function posix(value) {
  return value.replaceAll("\\", "/");
}

function resolveRepoRoot() {
  if (process.env.MONOREPO_ROOT) return path.resolve(process.env.MONOREPO_ROOT);
  return path.join(__dirname, "../..");
}

function rootsFrom(repoRoot) {
  const siteRoot = path.join(repoRoot, "site");
  const standaloneRoot = path.join(siteRoot, ".next", "standalone");
  const standaloneSiteRoot = path.join(standaloneRoot, "site");
  return {
    repoRoot,
    siteRoot,
    standaloneRoot,
    standaloneSiteRoot,
    staticSrc: path.join(siteRoot, ".next", "static"),
    publicSrc: path.join(siteRoot, "public"),
    genSrc: path.join(repoRoot, "scripts", "generate-svg.mjs"),
    genDirSrc: path.join(repoRoot, "scripts", "generate-svg"),
    lockfile: path.join(repoRoot, "pnpm-lock.yaml"),
    packageJson: path.join(repoRoot, "package.json"),
    techDocsOutput: path.join(repoRoot, "generated-documents", "site"),
    membershipPath: path.join(standaloneRoot, "artifact-membership.json"),
  };
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function dirHasEntries(dirPath) {
  return dirExists(dirPath) && fs.readdirSync(dirPath).length > 0;
}

function sha256File(filePath) {
  if (!fileExists(filePath)) return null;
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function directoryBytes(dirPath) {
  if (!dirExists(dirPath)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) total += directoryBytes(full);
    else {
      try {
        total += fs.statSync(full).size;
      } catch {
        /* ignore unreadable */
      }
    }
  }
  return total;
}

function walkFiles(dirPath, files = []) {
  if (!dirExists(dirPath)) return files;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else files.push(full);
  }
  return files;
}

function firstExisting(candidates) {
  return candidates.find((candidate) => fileExists(candidate) || dirExists(candidate)) ?? null;
}

function parseGitPorcelainPath(line) {
  if (!line || line.length < 4) return null;
  return line.slice(3).trim() || null;
}

function gitCapture(repoRoot) {
  const run = (args) => {
    try {
      return execFileSync("git", args, {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trimEnd();
    } catch {
      return null;
    }
  };
  const revision = run(["rev-parse", "HEAD"]);
  const porcelain = run(["status", "--porcelain"]);
  const dirtyPaths = porcelain
    ? porcelain
        .split(/\r?\n/)
        .map(parseGitPorcelainPath)
        .filter(Boolean)
    : [];
  return {
    revision: revision ? revision.trim() : null,
    dirty: dirtyPaths.length > 0,
    dirtyCount: dirtyPaths.length,
    dirtyPaths: dirtyPaths.slice(0, DIRTY_PATH_CAP),
  };
}

function toolVersion(command, args, cwd) {
  const names =
    process.platform === "win32" ? [`${command}.cmd`, `${command}.exe`, command] : [command];
  for (const name of names) {
    try {
      return execFileSync(name, args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      /* try next shim */
    }
  }
  if (process.platform === "win32") {
    try {
      const comspec = process.env.ComSpec || "cmd.exe";
      return execFileSync(comspec, ["/d", "/s", "/c", [command, ...args].join(" ")], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      /* fall through */
    }
  }
  const userAgent = process.env.npm_config_user_agent ?? "";
  const match = userAgent.match(new RegExp(`${command}/([^\\s]+)`));
  return match ? match[1] : null;
}

function collectBuildIdentity(ctx) {
  let declaredPackageManager = null;
  let nextVersion = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(ctx.packageJson, "utf8"));
    declaredPackageManager = pkg.packageManager ?? null;
    nextVersion = pkg.dependencies?.next ?? pkg.devDependencies?.next ?? null;
  } catch {
    /* missing package.json in fixture trees */
  }
  const buildIdPath = path.join(ctx.siteRoot, ".next", "BUILD_ID");
  return {
    git: gitCapture(ctx.repoRoot),
    node: process.version,
    pnpm: toolVersion("pnpm", ["--version"], ctx.repoRoot),
    packageManager: declaredPackageManager,
    next: nextVersion,
    lockfileSha256: sha256File(ctx.lockfile),
    buildId: fileExists(buildIdPath) ? fs.readFileSync(buildIdPath, "utf8").trim() : null,
    capturedAt: new Date().toISOString(),
  };
}

function assignedEnvNamesFromFile(filePath) {
  const names = new Set();
  if (!fileExists(filePath)) return names;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const name = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (name && value.length > 0) names.add(name);
  }
  return names;
}

function envNamePresence(ctx) {
  const fileNames = new Set([
    ...assignedEnvNamesFromFile(path.join(ctx.repoRoot, ".env.local")),
    ...assignedEnvNamesFromFile(path.join(ctx.siteRoot, ".env.local")),
  ]);
  return BUILD_RUNTIME_ENV_NAMES.map((name) => ({
    name,
    present: Boolean(process.env[name]?.trim()) || fileNames.has(name),
  }));
}

function copyGenerateSvg(ctx, base) {
  if (fileExists(ctx.genSrc)) {
    const dest = path.join(base, "scripts", "generate-svg.mjs");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(ctx.genSrc, dest);
  }
  if (dirExists(ctx.genDirSrc)) {
    copyRecursive(ctx.genDirSrc, path.join(base, "scripts", "generate-svg"));
  }
}

function copyStandaloneAssets(ctx) {
  copyRecursive(ctx.staticSrc, path.join(ctx.standaloneRoot, ".next", "static"));
  copyRecursive(ctx.publicSrc, path.join(ctx.standaloneRoot, "public"));
  copyGenerateSvg(ctx, ctx.standaloneRoot);
  if (dirExists(ctx.standaloneSiteRoot)) {
    copyRecursive(ctx.staticSrc, path.join(ctx.standaloneSiteRoot, ".next", "static"));
    copyRecursive(ctx.publicSrc, path.join(ctx.standaloneSiteRoot, "public"));
    copyGenerateSvg(ctx, ctx.standaloneSiteRoot);
  }
}

function locate(ctx, relPosix) {
  const rel = relPosix.split("/").join(path.sep);
  return [
    path.join(ctx.standaloneRoot, rel),
    path.join(ctx.standaloneSiteRoot, rel),
  ];
}

function clientNodeBinaries(ctx) {
  const roots = [
    path.join(ctx.standaloneRoot, ".next", "static"),
    path.join(ctx.standaloneSiteRoot, ".next", "static"),
  ];
  const found = [];
  for (const root of roots) {
    for (const file of walkFiles(root)) {
      if (file.endsWith(".node")) found.push(posix(file));
    }
  }
  return found;
}

function nativePackageStatus(ctx) {
  return NATIVE_PACKAGES.map((name) => {
    const candidates = [
      path.join(ctx.standaloneRoot, "node_modules", name),
      path.join(ctx.standaloneSiteRoot, "node_modules", name),
    ];
    const resolved = firstExisting(candidates);
    return {
      name,
      present: Boolean(resolved),
      resolved: resolved ? posix(resolved) : null,
    };
  });
}

function inspectStandalone(repoRoot = resolveRepoRoot()) {
  const ctx = rootsFrom(repoRoot);
  const serverCandidates = [
    path.join(ctx.standaloneSiteRoot, "server.js"),
    path.join(ctx.standaloneRoot, "server.js"),
  ];
  const staticCandidates = locate(ctx, ".next/static");
  const publicCandidates = locate(ctx, "public");
  const genMjsCandidates = locate(ctx, "scripts/generate-svg.mjs");
  const pipelineCandidates = locate(ctx, "scripts/generate-svg/pipelineCore.ts");
  const svgoCandidates = locate(ctx, "scripts/generate-svg/svgo.config.cjs");
  const fixtureCandidates = locate(ctx, "scripts/generate-svg/_fixtures");

  const serverResolved = firstExisting(serverCandidates);
  const staticResolved = firstExisting(staticCandidates.filter(dirHasEntries).concat(staticCandidates));
  const publicResolved = firstExisting(publicCandidates);
  const genMjsResolved = firstExisting(genMjsCandidates);
  const pipelineResolved = firstExisting(pipelineCandidates);
  const svgoResolved = firstExisting(svgoCandidates);
  const fixturesResolved = firstExisting(fixtureCandidates);

  const required = [
    {
      id: "server-entry",
      kind: "server",
      role: "required-runtime",
      required: true,
      present: Boolean(serverResolved),
      resolved: serverResolved ? posix(serverResolved) : null,
    },
    {
      id: "static-assets",
      kind: "static",
      role: "required-runtime",
      required: true,
      present: Boolean(staticResolved && dirHasEntries(staticResolved)),
      resolved: staticResolved ? posix(staticResolved) : null,
    },
    {
      id: "public-assets",
      kind: "public",
      role: "required-runtime",
      required: true,
      present: Boolean(publicResolved && dirExists(publicResolved)),
      resolved: publicResolved ? posix(publicResolved) : null,
    },
    {
      id: "generate-svg-entry",
      kind: "scripts",
      role: "required-runtime",
      required: true,
      present: Boolean(genMjsResolved),
      resolved: genMjsResolved ? posix(genMjsResolved) : null,
    },
    {
      id: "generate-svg-pipeline",
      kind: "scripts",
      role: "required-runtime",
      required: true,
      present: Boolean(pipelineResolved),
      resolved: pipelineResolved ? posix(pipelineResolved) : null,
    },
    {
      id: "generate-svg-svgo-config",
      kind: "scripts",
      role: "required-runtime",
      required: true,
      present: Boolean(svgoResolved),
      resolved: svgoResolved ? posix(svgoResolved) : null,
    },
  ];

  const fixtures = [
    {
      id: "generate-svg-fixtures",
      kind: "fixtures",
      role: "fixture",
      required: false,
      present: Boolean(fixturesResolved && dirExists(fixturesResolved)),
      resolved: fixturesResolved ? posix(fixturesResolved) : null,
      note: "Smoke fixtures; not production catalog authority.",
    },
  ];

  const excludedFromArtifact = [
    { id: "tests", path: "tests/", note: "Test sources must not ship in standalone." },
    { id: "coverage", path: "coverage/", note: "Coverage output is generated evidence, not runtime." },
    { id: "results-evidence", path: "results/", note: "Generated evidence; not a runtime dependency." },
    {
      id: "tech-docs-spa",
      path: "generated-documents/site/",
      note: "Separate Plan 05 output; not copied into Next standalone.",
    },
  ];

  const nodeBinariesInClient = clientNodeBinaries(ctx);
  const missingRequired = required.filter((item) => !item.present).map((item) => item.id);

  return {
    standaloneRoot: posix(ctx.standaloneRoot),
    standalonePresent: dirExists(ctx.standaloneRoot),
    members: { required, fixtures, excludedFromArtifact },
    nativePackages: nativePackageStatus(ctx),
    clientNodeBinaries: nodeBinariesInClient,
    sizes: {
      standaloneBytes: directoryBytes(ctx.standaloneRoot),
      staticBytes: directoryBytes(staticResolved ?? path.join(ctx.standaloneRoot, ".next", "static")),
      publicBytes: directoryBytes(publicResolved ?? path.join(ctx.standaloneRoot, "public")),
      serverBytes: serverResolved ? fs.statSync(serverResolved).size : 0,
      note: "Uncompressed on-disk bytes of this artifact. Not a transfer or budget figure.",
    },
    techDocs: {
      output: posix(ctx.techDocsOutput),
      present: dirExists(ctx.techDocsOutput),
      separateFromStandalone: true,
    },
    isolatedBoot: {
      command: "pnpm run start:standalone",
      origin: "http://localhost:3000",
      bind: "PORT=3000",
      status: "unrun",
      deepLinks: ISOLATED_DEEP_LINKS,
      note: "A successful next dev is not evidence of standalone completeness.",
    },
    missingRequired,
    ok: missingRequired.length === 0 && nodeBinariesInClient.length === 0,
  };
}

function writeMembership(ctx, inspection) {
  const document = {
    schema: "oando.standalone.artifact-membership.v1",
    buildIdentity: collectBuildIdentity(ctx),
    envNames: envNamePresence(ctx),
    inspection,
    comparison: {
      procedure:
        "Compare this document to a previously retained artifact-membership.json from an approved build. Diff required members, native package presence, lockfileSha256, and like-for-like size fields (standaloneBytes, staticBytes, publicBytes) separately. Do not treat historical numbers as current measurements.",
      budgets: "unset-until-approved-baseline",
    },
  };
  fs.writeFileSync(ctx.membershipPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  return document;
}

function prepareStandalone(repoRoot = resolveRepoRoot()) {
  const ctx = rootsFrom(repoRoot);
  if (!dirExists(ctx.standaloneRoot)) {
    return {
      skipped: true,
      ok: true,
      reason: "no-standalone-output",
      membershipPath: null,
    };
  }

  copyStandaloneAssets(ctx);
  const inspection = inspectStandalone(repoRoot);
  const document = writeMembership(ctx, inspection);
  return {
    skipped: false,
    ok: inspection.ok,
    membershipPath: ctx.membershipPath,
    missingRequired: inspection.missingRequired,
    clientNodeBinaries: inspection.clientNodeBinaries,
    document,
  };
}

function main() {
  const result = prepareStandalone();
  if (result.skipped) {
    console.log(
      "[prepare-standalone] No site/.next/standalone output — skipping (not a standalone build).",
    );
    process.exit(0);
  }
  console.log("[prepare-standalone] Copied static, public, and generate-svg into site/.next/standalone");
  console.log(`[prepare-standalone] Wrote ${posix(result.membershipPath)}`);
  if (!result.ok) {
    if (result.missingRequired.length > 0) {
      console.error(
        `[prepare-standalone] Missing required members: ${result.missingRequired.join(", ")}`,
      );
    }
    if (result.clientNodeBinaries.length > 0) {
      console.error(
        `[prepare-standalone] Native .node binaries in client static: ${result.clientNodeBinaries.join(", ")}`,
      );
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  BUILD_RUNTIME_ENV_NAMES,
  NATIVE_PACKAGES,
  collectBuildIdentity,
  inspectStandalone,
  parseGitPorcelainPath,
  prepareStandalone,
  resolveRepoRoot,
  rootsFrom,
};
