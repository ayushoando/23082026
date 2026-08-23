// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  monorepoRoot,
  "scripts/general/check-plans-purity.mjs",
);

function run(tmp: string) {
  return execFileSync(process.execPath, [scriptPath], {
    cwd: monorepoRoot,
    encoding: "utf8",
    env: { ...process.env, PLANS_PURITY_ROOT: tmp },
  });
}

function runExpectFail(tmp: string): string {
  try {
    run(tmp);
  } catch (error) {
    const err = error as { status?: number; stderr?: string; stdout?: string };
    expect(err.status).toBe(1);
    return `${err.stderr ?? ""}${err.stdout ?? ""}`;
  }
  throw new Error("expected script to fail");
}

describe("check-plans-purity", () => {
  it("fails when plans/ is absent", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-plans-purity-absent-"));
    try {
      expect(runExpectFail(tmp)).toContain("missing: plans/");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("passes when plans/ exists, regardless of contents", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-plans-purity-"));
    try {
      const planRoot = path.join(tmp, "plans");
      fs.mkdirSync(path.join(planRoot, "asset-cutover"), { recursive: true });
      fs.writeFileSync(path.join(planRoot, "notes.txt"), "scratch\n");
      fs.writeFileSync(path.join(planRoot, "asset-cutover", "mirror.json"), "{}\n");
      expect(run(tmp)).toContain("plans/ exists");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
