// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isRouteDomainRecord } from "../../tech-docs-generator/src/data/routeDomainTypes";

describe("isRouteDomainRecord", () => {
  it("accepts a full row", () => {
    expect(
      isRouteDomainRecord({
        id: "1",
        category: "app",
        label: "Home",
        value: "/",
        sourcePath: "site/app/page.tsx",
        sourceKind: "file",
        sourcePointer: "default",
      }),
    ).toBe(true);
  });

  it("rejects junk", () => {
    expect(isRouteDomainRecord(null)).toBe(false);
    expect(isRouteDomainRecord({ id: 1 })).toBe(false);
    expect(isRouteDomainRecord({ id: "1", category: "x" })).toBe(false);
  });
});
