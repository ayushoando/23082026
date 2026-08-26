// @vitest-environment node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  auditKeyParity,
  collectKeys,
  extractPlaceholders,
  namespacesForLocale,
  runCheck,
  subtree,
} from "../../../scripts/check-i18n-key-parity.mjs";

const siteRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const scriptPath = path.join(siteRoot, "scripts/check-i18n-key-parity.mjs");

describe("check-i18n-key-parity (name-mirror)", () => {
  it("exits 0 when locale message key trees match the parity manifest", () => {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
    });
    expect(output).toContain("check-i18n-key-parity: ok");
  });

  it("runCheck returns ok: true on repository translation messages", () => {
    const result = runCheck();
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.parityLocales).toContain("hi");
  });

  it("collectKeys flattens nested key hierarchies correctly", () => {
    const data = {
      hero: { title: "Title", cta: { label: "Click" } },
      items: ["a", "b"],
    };
    expect(collectKeys(data)).toEqual([
      "hero.title",
      "hero.cta.label",
      "items",
    ]);
  });

  it("subtree resolves dot-notated sub-objects", () => {
    const data = { auth: { form: { submit: "Submit" } } };
    expect(subtree(data, "auth.form")).toEqual({ submit: "Submit" });
  });

  it("extractPlaceholders extracts sorted interpolation variables", () => {
    expect(
      extractPlaceholders(
        "Hello {name}, you have {count} items in {format} format.",
      ),
    ).toEqual(["{count}", "{format}", "{name}"]);
    expect(extractPlaceholders("Static text without placeholders")).toEqual([]);
  });

  it("namespacesForLocale uses full en.json keys for hi, not wave1Namespaces", () => {
    const manifest = {
      wave1Namespaces: ["home"],
      allMarketingNamespaces: ["home", "about"],
      deferredLocales: ["fr"],
    };
    const baseMessages = { home: {}, about: {}, workspace: {} };

    expect(namespacesForLocale(manifest, baseMessages, "hi")).toEqual([
      "home",
      "about",
      "workspace",
    ]);
    expect(namespacesForLocale(manifest, baseMessages, "fr")).toEqual([
      "home",
      "about",
    ]);
    expect(namespacesForLocale(manifest, baseMessages, "en")).toEqual(["home"]);
  });

  it("auditKeyParity detects interpolation placeholder mismatches", () => {
    const baseMessages = {
      template: { greeting: "Hello {name}, total {count} items" },
    };
    const localeMessages = {
      template: { greeting: "नमस्ते {name}, कुल {total} वस्तुएं" },
    };

    const failures = auditKeyParity({
      baseLocale: "en",
      baseMessages,
      localeMessages,
      locale: "hi",
      namespaces: ["template"],
    });

    expect(failures).toEqual([
      {
        namespace: "template",
        locale: "hi",
        issue:
          "placeholder mismatch at template.greeting: expected [{count}, {name}], got [{name}, {total}]",
      },
    ]);
  });
});
