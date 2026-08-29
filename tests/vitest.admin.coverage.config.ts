import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

import {
  VITEST_CACHE_DIR,
  VITEST_COMMON_COVERAGE_REPORTERS,
  VITEST_COMMON_EXCLUDE,
  VITEST_COVERAGE_DIRS,
  VITEST_COVERAGE_THRESHOLDS,
  VITEST_REPO_ROOT,
  VITEST_SETUP_FILE,
  VITEST_WORKSPACE_ROOT,
} from "./vitest.shared.ts";

export default defineConfig({
  root: VITEST_REPO_ROOT,
  cacheDir: VITEST_CACHE_DIR,
  server: {
    fs: { allow: [VITEST_WORKSPACE_ROOT] },
  },
  resolve: {
    alias: {
      "@/types": path.resolve(VITEST_REPO_ROOT, "platform/types"),
      "@/app": path.resolve(VITEST_REPO_ROOT, "app"),
      "@/components": path.resolve(VITEST_REPO_ROOT, "components"),
      "@/data": path.resolve(VITEST_REPO_ROOT, "data"),
      "@/features": path.resolve(VITEST_REPO_ROOT, "features"),
      "@/lib": path.resolve(VITEST_REPO_ROOT, "lib"),
      "@/scripts": path.resolve(VITEST_WORKSPACE_ROOT, "scripts"),
      "@/tests": path.resolve(VITEST_WORKSPACE_ROOT, "tests"),
      "@focss": path.resolve(VITEST_WORKSPACE_ROOT, "site/focss"),
      "@": VITEST_REPO_ROOT,
    },
  },
  test: {
    env: {
      ...loadEnv("test", VITEST_WORKSPACE_ROOT, ""),
      NODE_ENV: "test",
      DEV_AUTH_BYPASS: "true",
    },
    pool: "forks",
    globals: true,
    environment: "happy-dom",
    // catalogAdminHandlers + priceBookGovernance + workspaceConfigurationRepository
    // touch node:* (crypto/fs/os) — must run in node, not happy-dom (which
    // externalizes node:* as browser and throws ERR_UNKNOWN_BUILTIN_MODULE).
    // Root is site/ — globs are matched relative to root, tests live at ../tests/.
    // @ts-expect-error -- vitest 4.x public types omit environmentMatchGlobs
    environmentMatchGlobs: [
      ["../tests/unit/features/admin/api/catalogAdminHandlers.test.ts", "node"],
      ["../tests/unit/features/admin/pricing/priceBookGovernance.test.ts", "node"],
      ["../tests/unit/features/admin/workspace-config/workspaceConfigurationRepository.server.test.ts", "node"],
    ],
    setupFiles: [VITEST_SETUP_FILE],
    reporters: ["default", "json"],
    include: [
      "../tests/unit/features/admin/**/*.test.ts",
      "../tests/unit/features/admin/**/*.test.tsx",
      "../tests/unit/app/api/admin/**/*.test.ts",
      "../tests/unit/app/admin/**/*.test.ts",
      "../tests/unit/app/admin/**/*.test.tsx",
    ],
    exclude: [...VITEST_COMMON_EXCLUDE],
    coverage: {
      provider: "v8",
      reportsDirectory: VITEST_COVERAGE_DIRS.admin,
      reporter: [...VITEST_COMMON_COVERAGE_REPORTERS],
      // `coverage.all` was removed in Vitest 4 — every file matching
      // `include` is instrumented by default. The option was silently ignored
      // here and type-errored under `typecheck:tests`.
      include: ["features/admin/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/archive/**",
        "**/.next/**",
        "**/public/**",
        "**/results/**",
        "**/scripts/**",
        "**/tests/**",
      ],
      // Approved metric-specific floor from tests/manifests/coverage-exceptions.json.
      thresholds: { ...VITEST_COVERAGE_THRESHOLDS },
    },
  },
});
