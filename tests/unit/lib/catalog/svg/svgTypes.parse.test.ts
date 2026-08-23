import { describe, expect, it } from "vitest";
import {
  BLOCK_DESCRIPTOR_SCHEMA_VERSION,
  freezeFreshDescriptor,
  freezeRewriteDescriptor,
  parseBlockDescriptor,
  plannerErr,
  plannerOk,
  toPlannerDescriptorErrorHttp,
  type BlockDescriptor,
  type PlannerDescriptorError,
} from "@/lib/catalog/svg/svgTypes";

const UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function baseFields() {
  return {
    schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
    id: UUID,
    slug: "unit-desk",
    sku: "UNIT-DESK-1",
    sourceProvenance: "native" as const,
    createdBy: "svg-types-parse-test",
    geometry: { widthMm: 1200, depthMm: 600, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1200, height: 600 },
    mounting: ["floor"] as const,
    themeTokens: {
      currentColor: "currentColor",
      "--fill-primary": "var(--color-surface-raised)",
    },
    rovingFocus: [
      { key: "top", focusSelector: "#desk-top", label: "Worksurface" },
    ],
    liveAnnouncementCategories: ["status"] as const,
    variant: "fixed" as const,
    fixed: { sizingType: "fixed" as const },
  };
}

function freshDescriptor(overrides: Record<string, unknown> = {}): BlockDescriptor {
  const result = freezeFreshDescriptor(
    { ...baseFields(), ...overrides },
    () => 1_752_000_100,
  );
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

describe("parseBlockDescriptor", () => {
  it("rejects non-objects", () => {
    for (const input of [null, undefined, "desk", 12, true]) {
      const result = parseBlockDescriptor(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("invalid");
        expect(result.error.fieldPath).toBe("slug:primitive");
      }
    }
  });

  it("requires schemaVersion", () => {
    const result = parseBlockDescriptor({ slug: "unit-desk" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
      expect(result.error.fieldPath).toBe("schemaVersion");
    }
  });

  it("returns versionMismatch when the pin does not match", () => {
    const result = parseBlockDescriptor({
      ...baseFields(),
      schemaVersion: "1999-01-01.v0",
      checksum: "0".repeat(64),
    });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "versionMismatch") {
      expect(result.error.expected).toBe(BLOCK_DESCRIPTOR_SCHEMA_VERSION);
      expect(result.error.actual).toBe("1999-01-01.v0");
      expect(result.error.code).toBe("422.version_mismatch");
    } else {
      expect.fail("expected versionMismatch");
    }
  });

  it("returns invalid when the body fails the schema", () => {
    const result = parseBlockDescriptor({
      ...baseFields(),
      slug: "BAD SLUG",
      checksum: "0".repeat(64),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
      expect(result.error.message).toMatch(/structural validation/);
    }
  });

  it("returns hashMismatch when the declared checksum is wrong", () => {
    const result = parseBlockDescriptor({
      ...baseFields(),
      generatedAt: 1_752_000_100,
      checksum: "ab".repeat(32),
    });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "hashMismatch") {
      expect(result.error.expected).toBe("ab".repeat(32));
      expect(result.error.actual).toMatch(/^[0-9a-f]{64}$/);
    } else {
      expect.fail("expected hashMismatch");
    }
  });

  it("accepts a frozen descriptor", () => {
    const frozen = freshDescriptor();
    const result = parseBlockDescriptor(frozen);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.slug).toBe("unit-desk");
      expect(result.value.checksum).toBe(frozen.checksum);
    }
  });
});

describe("toPlannerDescriptorErrorHttp", () => {
  it("maps each PlannerDescriptorError kind to its HTTP envelope", () => {
    const invalid: PlannerDescriptorError = {
      kind: "invalid",
      code: "422.invalid",
      fieldPath: "slug",
      message: "bad slug",
      issues: [{ path: "slug", message: "bad slug" }],
    };
    const version: PlannerDescriptorError = {
      kind: "versionMismatch",
      code: "422.version_mismatch",
      fieldPath: "schemaVersion",
      message: "pin drift",
      expected: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
      actual: "x",
    };
    const hash: PlannerDescriptorError = {
      kind: "hashMismatch",
      code: "409.hash_mismatch",
      fieldPath: "checksum",
      message: "mutated",
      expected: "aa",
      actual: "bb",
    };
    const missing: PlannerDescriptorError = {
      kind: "notFound",
      code: "404.not_found",
      fieldPath: "slug:gone",
      message: "missing",
      slug: "gone",
    };

    expect(toPlannerDescriptorErrorHttp(invalid)).toEqual({
      status: 422,
      body: {
        error: "invalid",
        code: "422.invalid",
        fieldPath: "slug",
        message: "bad slug",
      },
    });
    expect(toPlannerDescriptorErrorHttp(version).body.code).toBe(
      "422.version_mismatch",
    );
    expect(toPlannerDescriptorErrorHttp(hash)).toMatchObject({
      status: 409,
      body: { error: "hash_mismatch", code: "409.hash_mismatch" },
    });
    expect(toPlannerDescriptorErrorHttp(missing).status).toBe(404);
  });
});

describe("freezeFreshDescriptor", () => {
  it("rejects non-objects", () => {
    const result = freezeFreshDescriptor(null, () => 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
    }
  });

  it("stamps generatedAt and writes a matching checksum", () => {
    const result = freezeFreshDescriptor(baseFields(), () => 99.7);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.generatedAt).toBe(99);
      expect(result.value.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(parseBlockDescriptor(result.value).ok).toBe(true);
    }
  });

  it("keeps an existing generatedAt", () => {
    const result = freezeFreshDescriptor(
      { ...baseFields(), generatedAt: 42 },
      () => 999,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.generatedAt).toBe(42);
    }
  });

  it("returns invalid when the body cannot parse", () => {
    const result = freezeFreshDescriptor(
      { ...baseFields(), slug: "Nope" },
      () => 1,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
    }
  });
});

describe("freezeRewriteDescriptor", () => {
  it("rejects non-objects", () => {
    const previous = freshDescriptor();
    const result = freezeRewriteDescriptor(previous, "nope");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
    }
  });

  it("refuses a generatedAt mutation", () => {
    const previous = freshDescriptor();
    const result = freezeRewriteDescriptor(previous, {
      ...previous,
      generatedAt: (previous.generatedAt ?? 0) + 10,
    });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "hashMismatch") {
      expect(result.error.fieldPath).toBe("generatedAt");
    } else {
      expect.fail("expected generatedAt hashMismatch");
    }
  });

  it("returns invalid when the rewrite fails the schema", () => {
    const previous = freshDescriptor();
    const result = freezeRewriteDescriptor(previous, {
      ...previous,
      slug: "NOT-VALID",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid");
    }
  });

  it("refuses a content rewrite whose fingerprint drifted", () => {
    const previous = freshDescriptor();
    const result = freezeRewriteDescriptor(previous, {
      ...previous,
      sku: "CHANGED",
    });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "hashMismatch") {
      expect(result.error.fieldPath).toBe("checksum");
    } else {
      expect.fail("expected checksum hashMismatch");
    }
  });

  it("accepts an identical rewrite", () => {
    const previous = freshDescriptor();
    const result = freezeRewriteDescriptor(previous, { ...previous });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.checksum).toBe(previous.checksum);
    }
  });
});

describe("plannerOk / plannerErr", () => {
  it("wraps success and error", () => {
    expect(plannerOk<number, string>(3)).toEqual({ ok: true, value: 3 });
    expect(plannerErr<number, string>("nope")).toEqual({
      ok: false,
      error: "nope",
    });
  });
});
