import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Label } from "@/components/ui/Label";

describe("Label Component", () => {
  it("renders accessible label with htmlFor and data-slot, and fires click", () => {
    const onClick = vi.fn();
    render(
      <Label htmlFor="email-field" data-testid="label" onClick={onClick}>
        Email
      </Label>,
    );
    const label = screen.getByTestId("label");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "email-field");
    expect(label).toHaveAttribute("data-slot", "label");
    expect(label).toHaveTextContent("Email");
    expect(label).toHaveClass("admin-field__label");
  });

  it("merges default admin-field__label with custom className", () => {
    render(
      <Label className="custom-class" data-testid="label">
        Test Label
      </Label>,
    );
    const label = screen.getByTestId("label");
    expect(label).toHaveClass("admin-field__label");
    expect(label).toHaveClass("custom-class");
  });

  it("forwards ref to the underlying label element", () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(
      <Label ref={ref} data-testid="label">
        Ref label
      </Label>,
    );
    const label = screen.getByTestId("label");
    expect(ref.current).toBe(label);
    expect(ref.current?.tagName).toBe("LABEL");
  });

  it("associates with an input via getByLabelText and dispatches click", () => {
    render(
      <>
        <Label htmlFor="field-a">Field A</Label>
        <input id="field-a" data-testid="field-a" />
      </>,
    );
    const input = screen.getByLabelText("Field A");
    expect(input).toHaveAttribute("id", "field-a");
    expect(input).toHaveAttribute("data-testid", "field-a");
  });
});
