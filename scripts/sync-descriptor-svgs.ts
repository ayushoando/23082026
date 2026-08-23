/**
 * Compile every block-descriptor to public/assets/others/legacy/svg-catalog/{slug}.svg (maker or blocks path).
 *
 * Run: pnpm --filter oando-site run sync:descriptor-svgs
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  runPipelineCore,
  type PipelineDescriptor,
} from "./generate-svg/pipelineCore";
import {
  resolveBlockDescriptorsDir,
  resolvePublicDir,
} from "../site/lib/paths/sitePackageRoot";
import {
  clearLoaderCache,
  loadAll,
} from "../site/lib/catalog/svg/svgBlockDescriptorLoader";

function normalizeForPipeline(
  descriptor: Record<string, unknown>,
): PipelineDescriptor {
  const slug = String(descriptor.slug || "").trim();
  if (!slug) {
    throw new Error("Pipeline requires descriptor.slug");
  }

  let viewBox: { x: number; y: number; width: number; height: number } | null =
    null;
  if (
    descriptor.viewBox &&
    typeof descriptor.viewBox === "object" &&
    !Array.isArray(descriptor.viewBox)
  ) {
    const vb = descriptor.viewBox as Record<string, unknown>;
    viewBox = {
      x: Number(vb.x) || 0,
      y: Number(vb.y) || 0,
      width: Number(vb.width) || 0,
      height: Number(vb.height) || 0,
    };
  }

  let blocks: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
  }> = [];
  if (Array.isArray(descriptor.blocks)) {
    blocks = descriptor.blocks.map((raw, index) => {
      const b = (raw ?? {}) as Record<string, unknown>;
      const height = Number(b.height ?? b.depth) || 0;
      return {
        x: Number(b.x) || 0,
        y: Number(b.y) || 0,
        width: Number(b.width) || 0,
        height,
        id: typeof b.id === "string" ? b.id : `block-${index}`,
      };
    });
  }

  const type = typeof descriptor.type === "string" ? descriptor.type : "";
  const recipe = typeof descriptor.recipe === "string" ? descriptor.recipe : "";
  if (
    blocks.length === 0 &&
    (type === "linear-desk" || recipe === "linear-desk")
  ) {
    const widthMm = Number(descriptor.widthMm) || 0;
    const depthMm = Number(descriptor.depthMm) || 0;
    if (widthMm > 0 && depthMm > 0) {
      viewBox = { x: 0, y: 0, width: widthMm, height: depthMm };
      blocks = [
        {
          id: "desktop",
          x: 0,
          y: 0,
          width: widthMm,
          height: depthMm,
        },
      ];
    }
  }

  if (!viewBox || viewBox.width <= 0 || viewBox.height <= 0) {
    const dims =
      descriptor.dimensions &&
      typeof descriptor.dimensions === "object" &&
      !Array.isArray(descriptor.dimensions)
        ? (descriptor.dimensions as Record<string, unknown>)
        : null;
    const widthMm = Number(dims?.widthMm ?? descriptor.widthMm) || 0;
    const depthMm = Number(dims?.depthMm ?? descriptor.depthMm) || 0;
    if (widthMm > 0 && depthMm > 0) {
      viewBox = { x: 0, y: 0, width: widthMm, height: depthMm };
    }
  }

  if (!viewBox || viewBox.width <= 0 || viewBox.height <= 0) {
    throw new Error(`descriptor ${slug} missing usable viewBox/dimensions`);
  }

  const themeTokens =
    descriptor.themeTokens &&
    typeof descriptor.themeTokens === "object" &&
    !Array.isArray(descriptor.themeTokens)
      ? (descriptor.themeTokens as Record<string, string | undefined>)
      : undefined;

  return {
    slug,
    name: typeof descriptor.name === "string" ? descriptor.name : undefined,
    description:
      typeof descriptor.description === "string"
        ? descriptor.description
        : undefined,
    variant:
      typeof descriptor.variant === "string"
        ? (descriptor.variant as PipelineDescriptor["variant"])
        : "union",
    viewBox,
    blocks,
    themeTokens,
  };
}

export async function syncDescriptorSvgs(
  options: {
    outDir?: string;
    descriptors?: ReturnType<typeof loadAll>;
    forceReload?: boolean;
  } = {},
): Promise<{ ok: number; fail: number; failures: string[] }> {
  clearLoaderCache();
  const descriptors =
    options.descriptors ??
    loadAll({ forceReload: options.forceReload ?? true });
  const outDir =
    options.outDir ??
    path.join(resolvePublicDir(), "assets", "others", "legacy", "svg-catalog");
  mkdirSync(outDir, { recursive: true });

  let ok = 0;
  let fail = 0;
  const failures: string[] = [];

  for (const descriptor of descriptors) {
    try {
      const jsonPath = path.join(
        resolveBlockDescriptorsDir(),
        `${descriptor.slug}.json`,
      );
      const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as Record<
        string,
        unknown
      >;
      const normalized = normalizeForPipeline(raw);
      const svg = await runPipelineCore(normalized);
      const outPath = path.join(outDir, `${descriptor.slug}.svg`);
      writeFileSync(outPath, `${svg}\n`, "utf8");
      console.log(`wrote ${outPath}`);
      ok += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`FAIL ${descriptor.slug}: ${message}`);
      fail += 1;
      failures.push(descriptor.slug);
    }
  }

  console.log(`sync:descriptor-svgs done ok=${ok} fail=${fail}`);
  return { ok, fail, failures };
}

async function main(): Promise<void> {
  const result = await syncDescriptorSvgs();
  if (result.fail > 0) process.exitCode = 1;
}

const isDirect =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.resolve(process.argv[1]).includes("sync-descriptor-svgs");

if (isDirect && process.env.NODE_ENV !== "test") {
  void main();
}
