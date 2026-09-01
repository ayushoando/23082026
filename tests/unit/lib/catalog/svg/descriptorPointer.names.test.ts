// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isLatestPointerFilename,
  isLegacyDescriptorFilename,
  isVersionedDescriptorFilename,
  latestPointerPath,
  legacyDescriptorPath,
  slugFromLatestPointerFilename,
  versionedDescriptorPath,
} from "@/lib/catalog/svg/descriptorPointer";

describe("descriptorPointer names", () => {
  const dir = path.join("tmp", "descriptors");

  it("builds pointer and version paths", () => {
    expect(latestPointerPath("mesh-chair", dir)).toMatch(/mesh-chair\.latest\.json$/);
    expect(versionedDescriptorPath("mesh-chair", 3, dir)).toMatch(/mesh-chair\.3\.json$/);
    expect(legacyDescriptorPath("mesh-chair", dir)).toMatch(/mesh-chair\.json$/);
  });

  it("classifies filenames", () => {
    expect(isVersionedDescriptorFilename("mesh-chair.2.json")).toBe(true);
    expect(isLatestPointerFilename("mesh-chair.latest.json")).toBe(true);
    expect(isLegacyDescriptorFilename("mesh-chair.json")).toBe(true);
    expect(isVersionedDescriptorFilename("mesh-chair.latest.json")).toBe(false);
    expect(slugFromLatestPointerFilename("mesh-chair.latest.json")).toBe("mesh-chair");
    expect(slugFromLatestPointerFilename("nope.json")).toBeNull();
  });
});
