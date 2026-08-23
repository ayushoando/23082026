import { describe, it, expect } from "vitest";
import ProductsLayout from "@/app/(site)/products/layout";

describe("ProductsLayout", () => {
  it("returns children unchanged (pass-through)", () => {
    const child = { type: "div", props: { children: "only" } };
    expect(ProductsLayout({ children: child as never })).toBe(child);
  });
});
