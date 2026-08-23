/**
 * Manual Admin DB push for inventory descriptors (PNG release-record path).
 *
 * Retargeted in Phase 5 D8: writes the `block_descriptors` release record via
 * `persistBlockDescriptorToSupabase`.
 *
 * Usage (repo root):
 *   pnpm exec tsx scripts/pushSvgCatalogToDb.ts --slug=oando-linear-desk-1600
 *   pnpm exec tsx scripts/pushSvgCatalogToDb.ts --all
 *
 * Requires: ADMIN_DATABASE_URL (or SUPABASE_AUTH_DATABASE_URL).
 * Does NOT set SVG_RELEASE_AUTHORITY=db. Does NOT write public/svg-catalog.
 */
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Module from "node:module";

import type { BlockDescriptor } from "../site/lib/catalog/svg/svgTypes";
import { persistBlockDescriptorToSupabase } from "../site/lib/catalog/blockDescriptorStore.supabase";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

// SAFETY: Node's internal Module._load hook is not exposed in public @types/node declarations.
const originalLoad = (
  Module as unknown as {
    _load: (request: string, parent: NodeModule, isMain: boolean) => unknown;
  }
)._load;
// SAFETY: Hooking Module._load requires casting Module to assign the internal _load function.
(
  Module as unknown as {
    _load: (request: string, parent: NodeModule, isMain: boolean) => unknown;
  }
)._load = function (request: string, parent: NodeModule, isMain: boolean) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};

function descriptorDir(): string {
  const fromSite = path.join(process.cwd(), "site", "inventory", "descriptors");
  if (existsSync(fromSite)) {
    return fromSite;
  }
  return path.join(process.cwd(), "inventory", "descriptors");
}

function parseSlugs(): string[] {
  const allFlag = process.argv.includes("--all");
  const slugFlag = process.argv.find((a) => a.startsWith("--slug="));
  const dir = descriptorDir();

  if (allFlag) {
    return readdirSync(dir)
      .filter(
        (name) =>
          name.endsWith(".json") &&
          !name.includes(".latest.") &&
          !name.startsWith("_") &&
          !/\.\d+\.json$/.test(name),
      )
      .map((name) => name.replace(/\.json$/, ""))
      .sort();
  }

  const slug = slugFlag?.slice("--slug=".length).trim() || "";
  if (!slug) {
    console.error("Provide --slug=<descriptor-slug> or --all");
    process.exit(1);
  }
  return [slug];
}

function loadDescriptor(slug: string): BlockDescriptor | { error: string } {
  const file = path.join(descriptorDir(), `${slug}.json`);
  if (!existsSync(file)) {
    return { error: `descriptor missing: ${file}` };
  }
  try {
    return JSON.parse(readFileSync(file, "utf8")) as BlockDescriptor;
  } catch (error) {
    return {
      error: `descriptor parse: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function pushSlug(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const loaded = loadDescriptor(slug);
  if ("error" in loaded) {
    return { ok: false, error: loaded.error };
  }

  try {
    // SAFETY: BlockDescriptor is a structured JSON object compatible with Record<string, unknown>.
    const descriptorData = loaded as unknown as Record<string, unknown>;
    await persistBlockDescriptorToSupabase({
      slug,
      descriptor: descriptorData,
      lifecycle: "live",
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const slugs = parseSlugs();
  console.log(`Manual DB release-record push for ${slugs.length} slug(s)…`);

  let ok = 0;
  let fail = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  for (const slug of slugs) {
    const result = await pushSlug(slug);
    if (result.ok === false) {
      fail += 1;
      const err = result.error;
      failures.push({ slug, error: err });
      console.error(`FAIL ${slug}: ${err}`);
    } else {
      ok += 1;
      console.log(`OK ${slug}`);
    }
  }

  console.log(`Done. ok=${ok} fail=${fail}`);
  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
