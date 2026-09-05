// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const scriptPath = path.join(monorepoRoot, "scripts/general/prepare-standalone.cjs");

function writeFile(filePath: string, contents: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function seedStandaloneTree(tmp: string) {
  writeFile(path.join(tmp, "package.json"), JSON.stringify({ packageManager: "pnpm@11.24.0" }));
  writeFile(path.join(tmp, "pnpm-lock.yaml"), "lockfileVersion: 9.0\n");
  writeFile(path.join(tmp, "scripts/generate-svg.mjs"), "export const marker = 1;\n");
  writeFile(
    path.join(tmp, "scripts/generate-svg/pipelineCore.ts"),
    "export function runPipelineCore() { return '<svg/>'; }\n",
  );
  writeFile(path.join(tmp, "scripts/generate-svg/svgo.config.cjs"), "module.exports = {};\n");
  writeFile(path.join(tmp, "scripts/generate-svg/_fixtures/desk.json"), '{"slug":"desk"}\n');
  writeFile(path.join(tmp, "site/.next/static/chunks/app.js"), "console.log('static');\n");
  writeFile(path.join(tmp, "site/public/favicon.ico"), "ico");
  writeFile(path.join(tmp, "site/.next/standalone/site/server.js"), "console.log('server');\n");
  writeFile(path.join(tmp, "site/.next/BUILD_ID"), "test-build-id\n");
}

function runPrepare(tmp: string, extraEnv: Record<string, string | undefined> = {}) {
  return execFileSync(process.execPath, [scriptPath], {
    cwd: tmp,
    encoding: "utf8",
    env: { ...process.env, MONOREPO_ROOT: tmp, ...extraEnv },
  });
}

describe("prepare-standalone (name-mirror)", () => {
  it("skips when site/.next/standalone is absent", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prepare-standalone-skip-"));
    try {
      const output = runPrepare(tmp);
      expect(output).toContain("No site/.next/standalone output");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("copies static, public, and generate-svg then writes a secret-free membership document", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prepare-standalone-ok-"));
    try {
      seedStandaloneTree(tmp);
      writeFile(
        path.join(tmp, ".env.local"),
        "NEXT_PUBLIC_SITE_URL=http://secret.example.test\nSUPABASE_SERVICE_ROLE_KEY=service-role-secret\n",
      );
      const output = runPrepare(tmp, {
        PREPARE_STANDALONE_TEST_SECRET: "super-secret-value",
      });
      expect(output).toContain("Copied static, public, and generate-svg");

      expect(
        fs.existsSync(path.join(tmp, "site/.next/standalone/.next/static/chunks/app.js")),
      ).toBe(true);
      expect(
        fs.existsSync(path.join(tmp, "site/.next/standalone/site/.next/static/chunks/app.js")),
      ).toBe(true);
      expect(fs.existsSync(path.join(tmp, "site/.next/standalone/public/favicon.ico"))).toBe(
        true,
      );
      expect(
        fs.existsSync(path.join(tmp, "site/.next/standalone/scripts/generate-svg.mjs")),
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(tmp, "site/.next/standalone/scripts/generate-svg/pipelineCore.ts"),
        ),
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(tmp, "site/.next/standalone/site/scripts/generate-svg/_fixtures/desk.json"),
        ),
      ).toBe(true);

      const membershipPath = path.join(
        tmp,
        "site/.next/standalone/artifact-membership.json",
      );
      const raw = fs.readFileSync(membershipPath, "utf8");
      expect(raw).not.toContain("super-secret-value");
      expect(raw).not.toContain("service-role-secret");
      expect(raw).not.toContain("secret.example.test");
      const document = JSON.parse(raw) as {
        schema: string;
        envNames: Array<{ name: string; present: boolean }>;
        inspection: {
          members: { required: Array<{ id: string; present: boolean }> };
          isolatedBoot: { status: string; origin: string };
          techDocs: { separateFromStandalone: boolean };
          ok: boolean;
        };
      };
      expect(document.schema).toBe("oando.standalone.artifact-membership.v1");
      expect(document.envNames.some((entry) => entry.name === "SUPABASE_SERVICE_ROLE_KEY")).toBe(
        true,
      );
      expect(
        document.envNames.find((entry) => entry.name === "SUPABASE_SERVICE_ROLE_KEY")?.present,
      ).toBe(true);
      expect(
        document.envNames.find((entry) => entry.name === "NEXT_PUBLIC_SITE_URL")?.present,
      ).toBe(true);
      expect(document.inspection.members.required.every((item) => item.present)).toBe(true);
      expect(document.inspection.isolatedBoot.status).toBe("unrun");
      expect(document.inspection.isolatedBoot.origin).toBe("http://localhost:3000");
      expect(document.inspection.techDocs.separateFromStandalone).toBe(true);
      expect(document.inspection.ok).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("fails when the server entry is missing from a standalone tree", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "prepare-standalone-miss-"));
    try {
      seedStandaloneTree(tmp);
      fs.rmSync(path.join(tmp, "site/.next/standalone/site/server.js"));
      let stderr = "";
      let status = 0;
      try {
        runPrepare(tmp);
      } catch (error) {
        const failure = error as { status?: number; stderr?: string; stdout?: string };
        status = failure.status ?? 0;
        stderr = `${failure.stderr ?? ""}${failure.stdout ?? ""}`;
      }
      expect(status).toBe(1);
      expect(stderr).toContain("Missing required members: server-entry");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
