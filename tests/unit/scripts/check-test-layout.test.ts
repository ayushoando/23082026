// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(monorepoRoot, "scripts/general/check-test-layout.mjs");

describe("check-test-layout (name-mirror)", () => {
  it("exits 0 when co-located tests are absent under source scan roots", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-test-layout-"));
    try {
      for (const root of [
        "site/app",
        "site/components",
        "site/features",
        "site/hooks",
        "site/i18n",
        "site/lib",
        "site/platform",
        "site/server",
        "site/store",
      ]) {
        fs.mkdirSync(path.join(tmp, root), { recursive: true });
      }
      fs.writeFileSync(path.join(tmp, "site/app", "page.tsx"), "export default function Page() { return null; }\n");
      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: monorepoRoot,
        encoding: "utf8",
        env: { ...process.env, MONOREPO_ROOT: tmp },
      });
      expect(output).toContain("test layout OK");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("exits 1 when a co-located test file is present under a source root", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-test-layout-bad-"));
    try {
      fs.mkdirSync(path.join(tmp, "site/lib"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "site/lib", "util.test.ts"), "export {};\n");
      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: monorepoRoot,
          encoding: "utf8",
          env: { ...process.env, MONOREPO_ROOT: tmp },
        });
      } catch (error) {
        const failure = error as { status?: number; stderr?: string; stdout?: string };
        expect(failure.status).toBe(1);
        stderr = `${failure.stderr ?? ""}${failure.stdout ?? ""}`;
      }
      expect(stderr).toContain("check-test-layout: 1 violation(s)");
      expect(stderr).toContain("co-located test:");
      expect(stderr.replaceAll("\\", "/")).toContain("site/lib/util.test.ts");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects a tooling test that does not mirror scripts/general", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-test-layout-mirror-"));
    try {
      fs.mkdirSync(path.join(tmp, "scripts/general"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "tests/unit/scripts"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "scripts/general", "sample.mjs"), "export {};\n");
      fs.writeFileSync(path.join(tmp, "tests/unit/scripts", "sample.test.ts"), "export {};\n");

      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: monorepoRoot,
          encoding: "utf8",
          env: { ...process.env, MONOREPO_ROOT: tmp },
        });
      } catch (error) {
        stderr = String((error as { stderr?: string }).stderr ?? "");
      }
      expect(stderr).toContain("non-canonical test: tests/unit/scripts/sample.test.ts");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("ignores Kiro-owned test files outside the external scan scope", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-test-layout-kiro-"));
    try {
      const paths = [
        ".kiro/specs/example/tests/spec-owned.spec.ts",
        "tests/.kiro/specs/example/tests/nested.spec.ts",
      ];
      for (const relative of paths) {
        fs.mkdirSync(path.dirname(path.join(tmp, relative)), { recursive: true });
        fs.writeFileSync(path.join(tmp, relative), "export {};\n");
      }

      const output = execFileSync(process.execPath, [scriptPath], {
        cwd: monorepoRoot,
        encoding: "utf8",
        env: { ...process.env, MONOREPO_ROOT: tmp },
      });
      expect(output).toContain("test layout OK");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
