// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  auditMarketingCopySource,
  loadManifest,
  runCheck,
} from "../../../scripts/check-site-ui-contract.mjs";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(
  siteRoot,
  "scripts/check-site-ui-contract.mjs",
);

describe("check-marketing-copy-source (name-mirror)", () => {
  it("exits 0 when wave1 i18n consumer files avoid routeCopy.ts", () => {
    const output = execFileSync(process.execPath, [scriptPath, "--scope=copy"], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-site-ui-contract: copy ok");
  });

  it("runCheck returns ok: true on repository files", () => {
    const result = runCheck({ siteRoot: path.join(siteRoot, "site") });
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.consumerPaths.length).toBeGreaterThan(0);
  });

  it("loadManifest loads marketing parity manifest with consumer paths", () => {
    const manifest = loadManifest(
      path.join(siteRoot, "site/i18n/marketing-parity-manifest.json"),
    );
    expect(Array.isArray(manifest.i18nConsumerPaths)).toBe(true);
    expect((manifest.i18nConsumerPaths as string[]).length).toBeGreaterThan(0);
  });

  it("auditMarketingCopySource detects forbidden routeCopy imports and missing next-intl", () => {
    const mockFiles: Record<string, string> = {
      "app/(site)/bad-import.tsx": `import { routeCopy } from "@/lib/site-data/routeCopy";`,
      "app/(site)/missing-intl.tsx": `export default function Page() { return <div>Static</div>; }`,
      "app/(site)/valid.tsx": `import { getTranslations } from "next-intl/server";`,
    };

    const { failures } = auditMarketingCopySource({
      consumerPaths: [
        "app/(site)/bad-import.tsx",
        "app/(site)/missing-intl.tsx",
        "app/(site)/valid.tsx",
        "app/(site)/non-existent.tsx",
      ],
      exists: (filePath) => {
        const normalized = filePath.replaceAll("\\", "/");
        return Object.keys(mockFiles).some((k) => normalized.endsWith(k));
      },
      readFile: (filePath) => {
        const normalized = filePath.replaceAll("\\", "/");
        for (const [key, content] of Object.entries(mockFiles)) {
          if (normalized.endsWith(key)) return content;
        }
        throw new Error(`File not found: ${filePath}`);
      },
    });

    expect(failures).toEqual([
      {
        file: "app/(site)/bad-import.tsx",
        issue: "imports routeCopy",
      },
      {
        file: "app/(site)/bad-import.tsx",
        issue: "missing next-intl consumer",
      },
      {
        file: "app/(site)/missing-intl.tsx",
        issue: "missing next-intl consumer",
      },
      {
        file: "app/(site)/non-existent.tsx",
        issue: "missing consumer file",
      },
    ]);
  });
});
