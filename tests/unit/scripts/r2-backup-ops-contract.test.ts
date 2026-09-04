import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");

function readRepoFile(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("R2 backup operations contract", () => {
  it("exposes the R2 retention pruner through the ops dispatcher", () => {
    const runOps = readRepoFile("scripts/run-ops.mjs");

    expect(runOps).toContain('"backup:r2:prune": (args) => runTsx("prune_r2_backups.ts", args)');
  });

  it("runs R2 retention pruning after the scheduled backup upload", () => {
    const workflow = readRepoFile(".github/workflows/supabase-backup-r2.yml");

    const uploadIndex = workflow.indexOf("pnpm run ops backup:supabase:r2");
    const pruneIndex = workflow.indexOf("pnpm run ops backup:r2:prune");

    expect(uploadIndex).toBeGreaterThan(-1);
    expect(pruneIndex).toBeGreaterThan(uploadIndex);
    expect(workflow).toContain("CLOUDFLARE_R2_ACCESS_KEY_ID");
    expect(workflow).toContain("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  });

  it("syncs the same canonical GitHub secret names that the workflow consumes", () => {
    const syncScript = readRepoFile("scripts/sync-github-backup-secrets.ps1");

    expect(syncScript).toContain("'CLOUDFLARE_S3_URL'");
    expect(syncScript).toContain("'CLOUDFLARE_R2_ACCESS_KEY_ID'");
    expect(syncScript).toContain("'CLOUDFLARE_R2_SECRET_ACCESS_KEY'");
    expect(syncScript).not.toMatch(/CLOULD_ACCESS_KEY_ID|CLOULDFLARE_S3_/);
  });
});
