import { describe, expect, it } from "vitest";
import {
  canonicalizeBlockDescriptorInput,
  computeBlockDescriptorChecksum,
} from "@/lib/catalog/svg/svgTypes";

describe("svgTypes checksum", () => {
  it("sorts object keys so key order does not change the digest", () => {
    const a = canonicalizeBlockDescriptorInput({ b: 1, a: 2 });
    expect(JSON.stringify(a)).toBe(JSON.stringify({ a: 2, b: 1 }));
    expect(
      computeBlockDescriptorChecksum({ z: 1, a: 2, checksum: "ignore-me" }),
    ).toBe(computeBlockDescriptorChecksum({ a: 2, z: 1 }));
  });

  it("walks arrays", () => {
    expect(canonicalizeBlockDescriptorInput([{ b: 1, a: 0 }])).toEqual([{ a: 0, b: 1 }]);
  });
});
