#!/usr/bin/env node
/**
 * Persistence mode + dual-database env hygiene (Plan 04).
 *
 * Checks configuration and templates only: no DB connections, no migrations,
 * no worker deploys, and no secret values in output.
 *
 * Usage: node scripts/general/check-env-persistence.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isCiGateWithoutSecrets } from "./ci-gate-env.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const ADMIN_REF = "rxzpznmxbaoxpikowmfc";
const PRODUCTS_REF = "erpweaiypimorcunaimz";

const TEMPLATE_PATHS = [
  ".env.example",
  "site/.env.example",
  "tech-docs-generator/.env.example",
];

const MODE_WRAPPERS = [
  "site/lib/Planner/plannerPersistenceMode.ts",
  "site/lib/catalog/furnitureCatalogMode.ts",
];

const TEMPLATE_REQUIRED_KEYS = {
  ".env.example": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_ADMIN_SUPABASE_URL",
    "SUPABASE_ADMIN_SERVICE_ROLE_KEY",
    "DEV_AUTH_BYPASS",
  ],
  "site/.env.example": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_ADMIN_SUPABASE_URL",
    "SUPABASE_ADMIN_SERVICE_ROLE_KEY",
    "DEV_AUTH_BYPASS",
  ],
  "tech-docs-generator/.env.example": [
    "NEXT_ADMIN_SUPABASE_URL",
    "NEXT_ADMIN_SUPABASE_ANON_KEY",
  ],
};

const DEAD_APM_KEY_NAMES = [
  "DATADOG_API_KEY",
  "DD_API_KEY",
  "NEW_RELIC_LICENSE_KEY",
  "NEW_RELIC_API_KEY",
  "TRACELOOP_API_KEY",
  "CAST_API_KEY",
  "CASTAI_API_TOKEN",
];

const FORBIDDEN_PUBLIC_NAME_PATTERNS = [
  /^NEXT_PUBLIC_.*SECRET/i,
  /^NEXT_PUBLIC_.*SERVICE_ROLE/i,
  /^NEXT_PUBLIC_.*PRIVATE/i,
];

const ANON_SLOT_KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_ADMIN_SUPABASE_ANON_KEY",
  "NEXT_ADMIN_PUBLISHABLE_KEY",
];

const SERVICE_ROLE_KEYS = [
  "SUPABASE_ADMIN_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function pick(env, key) {
  const value = env[key];
  return typeof value === "string" ? value.trim() : "";
}

function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

function projectRefFromUrl(url) {
  const match = String(url).match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match ? match[1].toLowerCase() : "";
}

function jwtRole(value) {
  const parts = value.split(".");
  if (parts.length !== 3) return "";
  try {
    const json = Buffer.from(
      parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const payload = JSON.parse(json);
    return typeof payload?.role === "string" ? payload.role : "";
  } catch {
    return "";
  }
}

function isCanonicalBypass(value) {
  return value === undefined || value === "" || value === "0" || value === "1";
}

function persistenceMode(env) {
  const bypass = env.DEV_AUTH_BYPASS;
  if (!isCanonicalBypass(bypass)) {
    throw new Error(
      `DEV_AUTH_BYPASS must be unset, empty, '0', or '1'; received a non-canonical value`,
    );
  }
  if (env.NODE_ENV !== "production" && bypass === "1") return "disk";
  return "supabase";
}

function checkTemplates() {
  const failures = [];
  for (const relative of TEMPLATE_PATHS) {
    const abs = path.join(ROOT, relative);
    if (!fs.existsSync(abs)) {
      failures.push(`missing template: ${relative}`);
      continue;
    }
    const text = fs.readFileSync(abs, "utf8");
    const map = parseEnvFile(text);
    for (const key of TEMPLATE_REQUIRED_KEYS[relative] || []) {
      if (!(key in map)) {
        failures.push(`${relative}: missing key ${key}`);
      }
    }
    for (const key of Object.keys(map)) {
      if (FORBIDDEN_PUBLIC_NAME_PATTERNS.some((pattern) => pattern.test(key))) {
        failures.push(`${relative}: forbidden public secret slot ${key}`);
      }
      if (DEAD_APM_KEY_NAMES.includes(key)) {
        failures.push(`${relative}: purged APM key ${key} must not return`);
      }
    }
    if (relative !== "tech-docs-generator/.env.example") {
      const productsRef = projectRefFromUrl(map.NEXT_PUBLIC_SUPABASE_URL || "");
      const adminRef = projectRefFromUrl(map.NEXT_ADMIN_SUPABASE_URL || "");
      if (productsRef && productsRef !== PRODUCTS_REF) {
        failures.push(
          `${relative}: NEXT_PUBLIC_SUPABASE_URL must target Products ref ${PRODUCTS_REF}`,
        );
      }
      if (adminRef && adminRef !== ADMIN_REF) {
        failures.push(
          `${relative}: NEXT_ADMIN_SUPABASE_URL must target Admin ref ${ADMIN_REF}`,
        );
      }
      if (productsRef && adminRef && productsRef === adminRef) {
        failures.push(`${relative}: Admin and Products URLs must not share a project`);
      }
    } else {
      const adminRef = projectRefFromUrl(map.NEXT_ADMIN_SUPABASE_URL || "");
      if (adminRef && adminRef !== ADMIN_REF) {
        failures.push(
          `${relative}: NEXT_ADMIN_SUPABASE_URL must target Admin ref ${ADMIN_REF}`,
        );
      }
      for (const key of Object.keys(map)) {
        if (/SERVICE_ROLE|DATABASE_URL/i.test(key)) {
          failures.push(`${relative}: client template must not declare ${key}`);
        }
      }
    }
    for (const key of ANON_SLOT_KEYS) {
      const value = map[key];
      if (value && jwtRole(value) === "service_role") {
        failures.push(`${relative}: ${key} must not hold a service-role JWT`);
      }
    }
    if (!isCanonicalBypass(map.DEV_AUTH_BYPASS)) {
      failures.push(`${relative}: DEV_AUTH_BYPASS is not canonical`);
    }
  }
  return failures;
}

function checkWrappers() {
  return MODE_WRAPPERS.filter((relative) => !fs.existsSync(path.join(ROOT, relative))).map(
    (relative) => `missing mode wrapper: ${relative}`,
  );
}

function checkRuntimeEnv(env) {
  const failures = [];
  if (!isCanonicalBypass(env.DEV_AUTH_BYPASS)) {
    failures.push("DEV_AUTH_BYPASS is not canonical (unset, empty, '0', or '1')");
    return failures;
  }

  let mode;
  try {
    mode = persistenceMode(env);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    return failures;
  }

  if (mode === "disk" && env.NODE_ENV === "production") {
    failures.push("disk persistence is not permitted when NODE_ENV=production");
  }

  const productsUrl = pick(env, "NEXT_PUBLIC_SUPABASE_URL");
  const adminUrl = pick(env, "NEXT_ADMIN_SUPABASE_URL");
  const productsRef = projectRefFromUrl(productsUrl);
  const adminRef = projectRefFromUrl(adminUrl);
  if (productsRef && adminRef && productsRef === adminRef) {
    failures.push("live Admin and Products Supabase URLs must not share a project");
  }

  for (const key of ANON_SLOT_KEYS) {
    const value = pick(env, key);
    if (value && jwtRole(value) === "service_role") {
      failures.push(`${key} holds a service-role JWT (finding 9.3)`);
    }
  }
  for (const key of Object.keys(env)) {
    if (!FORBIDDEN_PUBLIC_NAME_PATTERNS.some((pattern) => pattern.test(key))) continue;
    if (pick(env, key)) {
      failures.push(`forbidden public secret slot is set: ${key}`);
    }
  }

  const serviceValues = new Set(
    SERVICE_ROLE_KEYS.map((key) => pick(env, key)).filter(Boolean),
  );
  for (const key of ANON_SLOT_KEYS) {
    const value = pick(env, key);
    if (value && serviceValues.has(value)) {
      failures.push(`${key} duplicates a service-role key value`);
    }
  }

  if (isCiGateWithoutSecrets(env)) {
    return failures;
  }

  if (mode === "supabase") {
    if (!adminUrl) failures.push("Supabase mode requires NEXT_ADMIN_SUPABASE_URL");
    if (!pick(env, "SUPABASE_ADMIN_SERVICE_ROLE_KEY")) {
      failures.push("Supabase mode requires SUPABASE_ADMIN_SERVICE_ROLE_KEY");
    }
    if (!productsUrl) failures.push("Products catalog requires NEXT_PUBLIC_SUPABASE_URL");
    if (!pick(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
      failures.push("Products catalog requires NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
  }

  return failures;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

export function checkEnvPersistence(env = process.env) {
  const failures = [
    ...checkWrappers(),
    ...checkTemplates(),
    ...checkRuntimeEnv(env),
  ];
  return {
    ok: failures.length === 0,
    mode: isCanonicalBypass(env.DEV_AUTH_BYPASS)
      ? persistenceMode(env)
      : "invalid",
    skippedSecrets: isCiGateWithoutSecrets(env),
    failures,
  };
}

if (isDirectRun()) {
  require("./loadEnvLocal.cjs").loadEnvLocal();
  const result = checkEnvPersistence(process.env);
  const report = {
    ok: result.ok,
    mode: result.mode,
    skippedSecrets: result.skippedSecrets,
    templates: TEMPLATE_PATHS,
    wrappers: MODE_WRAPPERS,
    adminRef: ADMIN_REF,
    productsRef: PRODUCTS_REF,
    failures: result.failures,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!result.ok) {
    process.stderr.write(
      `check-env-persistence FAIL (${result.failures.length})\n${result.failures
        .map((item) => `  ${item}`)
        .join("\n")}\n`,
    );
    process.exitCode = 1;
  } else {
    process.stdout.write("check-env-persistence OK\n");
  }
}
