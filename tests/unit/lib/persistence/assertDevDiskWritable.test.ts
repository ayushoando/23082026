import { describe, expect, it } from "vitest";
import { assertDevDiskWritable } from "@/lib/persistence/assertDevDiskWritable";

describe("assertDevDiskWritable", () => {
  it("allows disk when bypass is on and not production", () => {
    expect(() =>
      assertDevDiskWritable({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" }),
    ).not.toThrow();
  });

  it("throws EROFS in production even with the flag", () => {
    try {
      assertDevDiskWritable({ NODE_ENV: "production", DEV_AUTH_BYPASS: "1" });
      expect.unreachable();
    } catch (e) {
      expect((e as NodeJS.ErrnoException).code).toBe("EROFS");
    }
  });

  it("throws EROFS when bypass is off", () => {
    expect(() => assertDevDiskWritable({ NODE_ENV: "development" })).toThrow(/EROFS|read-only/i);
  });
});
