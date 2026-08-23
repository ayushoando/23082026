import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import { AiAdvisorPanel } from "@/lib/ai/AiAdvisorPanel";
import { useAiAdvisor } from "@/lib/ai/useAiAdvisor";

vi.mock("@/lib/ai/useAiAdvisor", () => ({
  useAiAdvisor: vi.fn(),
}));

vi.mock("@phosphor-icons/react", () => ({
  PaperPlaneTilt: () => <span data-testid="icon-send" aria-hidden="true" />,
  X: () => <span data-testid="icon-x" aria-hidden="true" />,
  Sparkle: () => <span data-testid="icon-sparkle" aria-hidden="true" />,
  Sparkles: () => <span data-testid="icon-sparkle" aria-hidden="true" />,
  CircleNotch: () => <span data-testid="icon-loader" aria-hidden="true" />,
  Trash: () => <span data-testid="icon-trash" aria-hidden="true" />,
  Loader2: () => <span data-testid="icon-loader" aria-hidden="true" />,
}));

const mockedUseAiAdvisor = vi.mocked(useAiAdvisor);

const QUICK_PROMPTS = [
  "Suggest a layout for 8 people in 600 sq ft",
  "Best desk arrangement for collaboration",
  "How to plan zones in an open office?",
  "Recommend furniture for a meeting room",
] as const;

describe("AiAdvisorPanel — behavior", () => {
  const mockSendMessage = vi.fn();
  const mockClearMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });
  });

  it("renders trigger button with computed attributes and hides dialog initially", () => {
    render(<AiAdvisorPanel />);

    const trigger = screen.getByRole("button", { name: /Open AI Layout Advisor/i });
    expect(trigger).toHaveAttribute("aria-label", "Open AI Layout Advisor");
    expect(trigger).toHaveAttribute("title", "AI Layout Advisor — get furniture placement suggestions");
    expect(trigger).toHaveClass("fixed");
    expect(trigger).toHaveClass("bottom-6");
    expect(trigger).toHaveClass("right-6");
    expect(trigger).toHaveClass("rounded-full");
    expect(within(trigger).getByTestId("icon-sparkle")).toBeInTheDocument();
    expect(screen.getByText("AI Advisor")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ask about layout, furniture, zones...")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ask me about office layouts/i)).not.toBeInTheDocument();
  });

  it("applies position variant classes for bottom-right vs right-sidebar", () => {
    const { unmount } = render(<AiAdvisorPanel position="bottom-right" />);
    expect(screen.getByRole("button", { name: /Open AI Layout Advisor/i })).toHaveClass("right-6");
    expect(screen.getByRole("button", { name: /Open AI Layout Advisor/i })).not.toHaveClass("right-80");
    unmount();

    render(<AiAdvisorPanel position="right-sidebar" />);
    expect(screen.getByRole("button", { name: /Open AI Layout Advisor/i })).toHaveClass("right-80");
    expect(screen.getByRole("button", { name: /Open AI Layout Advisor/i })).toHaveClass("bottom-6");
  });

  it("opens dialog on trigger click with header, quick prompts, and input computed attributes", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    const dialog = screen.getByRole("dialog", { name: /AI Layout Advisor/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-label", "AI Layout Advisor");
    expect(dialog).toHaveClass("fixed");
    expect(dialog).toHaveClass("bottom-6");
    expect(dialog).toHaveClass("right-6");

    // header
    expect(within(dialog).getByText("AI Layout Advisor")).toBeInTheDocument();
    expect(within(dialog).getAllByTestId("icon-sparkle").length).toBeGreaterThanOrEqual(1);
    expect(within(dialog).getByTestId("icon-trash")).toBeInTheDocument();
    expect(within(dialog).getByTestId("icon-x")).toBeInTheDocument();
    const clearBtn = screen.getByRole("button", { name: /Clear conversation/i });
    expect(clearBtn).toHaveAttribute("aria-label", "Clear conversation");
    expect(clearBtn).toHaveAttribute("title", "Clear conversation");
    expect(clearBtn).toHaveClass("p-1");
    const closeBtn = screen.getByRole("button", { name: /Close AI Advisor/i });
    expect(closeBtn).toHaveAttribute("aria-label", "Close AI Advisor");
    expect(closeBtn).toHaveClass("p-1");

    // helper copy
    expect(screen.getByText(/Ask me about office layouts, furniture placement/i)).toBeInTheDocument();

    // quick prompts source-of-truth iteration
    for (const prompt of QUICK_PROMPTS) {
      const btn = screen.getByRole("button", { name: prompt });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass("rounded-lg");
      expect(btn).toHaveClass("border");
    }
    expect(screen.getAllByRole("button", { name: QUICK_PROMPTS[0] })).toHaveLength(1);

    // input
    const input = screen.getByPlaceholderText("Ask about layout, furniture, zones...") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("placeholder", "Ask about layout, furniture, zones...");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass("rounded-lg");
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue("");

    // send button
    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    expect(sendBtn).toHaveAttribute("type", "submit");
    expect(sendBtn).toHaveAttribute("aria-label", "Send message");
    expect(within(sendBtn).getByTestId("icon-send")).toBeInTheDocument();
    expect(sendBtn).toBeDisabled();

    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("calls sendMessage with correct args for each quick prompt via fireEvent", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    for (const prompt of QUICK_PROMPTS) {
      fireEvent.click(screen.getByText(prompt));
    }

    expect(mockSendMessage).toHaveBeenCalledTimes(QUICK_PROMPTS.length);
    for (const prompt of QUICK_PROMPTS) {
      expect(mockSendMessage).toHaveBeenCalledWith(prompt);
    }
    expect(mockSendMessage).not.toHaveBeenCalledWith("other");
  });

  it("displays user and assistant messages with computed alignment classes and hides quick prompts", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [
        { id: "1", role: "user", content: "hello", timestamp: 1 },
        { id: "2", role: "assistant", content: "hi there", timestamp: 2 },
      ],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("hi there")).toBeInTheDocument();

    // user wrapper uses justify-end, assistant justify-start
    const userWrapper = screen.getByText("hello").closest(".justify-end") as HTMLElement;
    expect(userWrapper).not.toBeNull();
    expect(userWrapper).toHaveClass("justify-end");
    const assistantWrapper = screen.getByText("hi there").closest(".justify-start") as HTMLElement;
    expect(assistantWrapper).not.toBeNull();
    expect(assistantWrapper).toHaveClass("justify-start");

    // bubbles have rounded-br-sm vs rounded-bl-sm on the bubble div (parent of whitespace-pre-wrap)
    const helloBubble = screen.getByText("hello").closest(".rounded-lg") as HTMLElement;
    expect(helloBubble).not.toBeNull();
    expect(helloBubble).toHaveClass("rounded-br-sm");
    const assistantBubble = screen.getByText("hi there").closest(".rounded-lg") as HTMLElement;
    expect(assistantBubble).not.toBeNull();
    expect(assistantBubble).toHaveClass("rounded-bl-sm");

    // quick prompts hidden when messages exist
    for (const prompt of QUICK_PROMPTS) {
      expect(screen.queryByText(prompt)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/Ask me about office layouts/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
  });

  it("shows thinking spinner with animate-spin and disables input when loading", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: true,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    expect(screen.getByText("Thinking...")).toBeInTheDocument();
    const thinkingRow = screen.getByText("Thinking...").closest("div") as HTMLElement;
    expect(thinkingRow).toBeInTheDocument();
    expect(thinkingRow).toHaveClass("flex");
    expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText("Ask about layout, furniture, zones...") as HTMLInputElement;
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("disabled", "");
    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    expect(sendBtn).toBeDisabled();
  });

  it("shows error banner with computed danger classes when error is present", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: false,
      error: "Something went wrong",
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    const errorEl = screen.getByText("Something went wrong");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveClass("bg-danger-soft");
    expect(errorEl).toHaveClass("text-danger");
    expect(errorEl).toHaveClass("rounded-lg");
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
    const input = screen.getByPlaceholderText("Ask about layout, furniture, zones...");
    expect(input).not.toBeDisabled();
  });

  it("submits trimmed input via form and clears value with vi.fn count+args", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    const input = screen.getByPlaceholderText("Ask about layout, furniture, zones...") as HTMLInputElement;
    const sendBtn = screen.getByRole("button", { name: /Send message/i });

    expect(sendBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: "  custom layout  " } });
    expect(input).toHaveValue("  custom layout  ");
    expect(input).toHaveAttribute("type", "text");
    expect(sendBtn).toBeEnabled();
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith("custom layout");
    expect(mockSendMessage).not.toHaveBeenCalledWith("  custom layout  ");
    expect(input).toHaveValue("");
    expect(sendBtn).toBeDisabled();
  });

  it("prevents submit when input empty or isLoading and keeps vi.fn untouched", () => {
    mockedUseAiAdvisor.mockReturnValue({
      messages: [],
      isLoading: true,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });
    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    const input = screen.getByPlaceholderText("Ask about layout, furniture, zones...") as HTMLInputElement;
    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    expect(sendBtn).toBeDisabled();
    expect(input).toBeDisabled();

    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.click(sendBtn);
    expect(mockSendMessage).not.toHaveBeenCalled();

    // empty form submit via form event also blocked — simulate direct submit
    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("closes panel via close button and restores trigger with queryBy absence", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));
    expect(screen.getByRole("dialog", { name: /AI Layout Advisor/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close AI Advisor/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ask about layout, furniture, zones...")).not.toBeInTheDocument();
    for (const prompt of QUICK_PROMPTS) {
      expect(screen.queryByText(prompt)).not.toBeInTheDocument();
    }
    const trigger = screen.getByRole("button", { name: /Open AI Layout Advisor/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-label", "Open AI Layout Advisor");
    expect(within(trigger).getByTestId("icon-sparkle")).toBeInTheDocument();
  });

  it("clears conversation via trash button with vi.fn count+args", () => {
    render(<AiAdvisorPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Open AI Layout Advisor/i }));

    const clearBtn = screen.getByRole("button", { name: /Clear conversation/i });
    expect(clearBtn).toHaveAttribute("aria-label", "Clear conversation");
    expect(clearBtn).toHaveClass("p-1");
    fireEvent.click(clearBtn);

    expect(mockClearMessages).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
