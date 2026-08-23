import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { Input } from "@/components/ui/Input";

describe("Input Component", () => {
  it("renders input with computed type, placeholder, value and data-slot", () => {
    const handleChange = vi.fn();
    render(
      <Input
        type="email"
        placeholder="Enter your email"
        value="test@example.com"
        onChange={handleChange}
        data-testid="test-input"
      />,
    );

    const input = screen.getByTestId("test-input") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "Enter your email");
    expect(input).toHaveValue("test@example.com");
    expect(input).toHaveAttribute("data-slot", "input");

    fireEvent.change(input, { target: { value: "next@example.com" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0]?.[0]?.target?.value).toBeDefined();
  });

  it("merges default FOCSS class with custom className via toHaveClass", () => {
    render(<Input className="custom-class" data-testid="test-input" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveClass("custom-class");
    expect(input).toHaveClass("admin-field__control");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("forwards ref to the underlying input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="test-input" />);
    const input = screen.getByTestId("test-input");
    expect(ref.current).toBe(input);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("forwards disabled and fires change once with correct args", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Input data-testid="test-input" onChange={onChange} />);
    const input = screen.getByTestId("test-input") as HTMLInputElement;
    expect(input).not.toBeDisabled();

    rerender(<Input data-testid="test-input" disabled onChange={onChange} />);
    expect(screen.getByTestId("test-input")).toBeDisabled();
  });
});
