import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { UnifiedAssistant } from "@/features/site/assistant/UnifiedAssistant";
import {
  AI_ADVISOR_COPY,
  AI_ASSISTANT_REFINERS,
  AI_ASSISTANT_STARTERS,
  AI_ASSISTANT_WELCOME_MESSAGE,
  AI_CHATBOT_COPY,
  GUIDED_PLANNER_COPY,
  MOBILE_ASSISTANT_COPY,
} from "@/features/site/data/assistant";
import { invalidateCsrfToken } from "@/lib/api/browserApi";

const executeContactAction = vi.fn();
const mockPathname = vi.fn(() => "/");
const mockHasConsentChoice = vi.fn(() => true);

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/lib/consent", () => ({
  hasConsentChoice: () => mockHasConsentChoice(),
}));

vi.mock("@/lib/displayText", () => ({
  sanitizeDisplayText: (text: string) => text,
}));

vi.mock("@/lib/catalog/site/categories", () => ({
  getCatalogProductHref: (category: string, key: string) => `/products/${category}/${key}`,
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right" aria-hidden="true" />,
  Robot: () => <span data-testid="icon-bot" aria-hidden="true" />,
  CheckCircle: () => <span data-testid="icon-check" aria-hidden="true" />,
  CircleNotch: () => <span data-testid="icon-loader" aria-hidden="true" />,
  ChatText: () => <span data-testid="icon-chat" aria-hidden="true" />,
  PaperPlaneTilt: () => <span data-testid="icon-send" aria-hidden="true" />,
  Sparkle: () => <span data-testid="icon-sparkle" aria-hidden="true" />,
  MagicWand: () => <span data-testid="icon-wand" aria-hidden="true" />,
  X: () => <span data-testid="icon-x" aria-hidden="true" />,
}));

vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    executeAsync: (input: unknown) => executeContactAction(input),
    isExecuting: false,
    status: "idle",
    result: {},
    reset: vi.fn(),
    execute: vi.fn(),
    isIdle: true,
    isPending: false,
    isTransitioning: false,
    hasSucceeded: false,
    hasErrored: false,
    hasNavigated: false,
    input: undefined,
  }),
}));

function okJson(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => payload,
    headers: { get: () => null },
  } as unknown as Response);
}

function ndjsonStream(lines: string[]) {
  const encoder = new TextEncoder();
  let index = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (index < lines.length) {
        controller.enqueue(encoder.encode(`${lines[index]}\n`));
        index += 1;
      } else {
        controller.close();
      }
    },
  });
  return Promise.resolve({
    ok: true,
    json: async () => ({}),
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/x-ndjson" : null),
    },
    body,
  } as Response);
}

function isCsrfUrl(input: RequestInfo | URL): boolean {
  return String(input).includes("/api/csrf");
}

function desktopLauncher() {
  return screen.getByRole("button", { name: "Open AI chatbot" });
}

describe("UnifiedAssistant — behavior", () => {
  beforeEach(() => {
    invalidateCsrfToken();
    mockPathname.mockReturnValue("/");
    mockHasConsentChoice.mockReturnValue(true);
    executeContactAction.mockReset();
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width: 640px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders desktop launcher with computed aria-label, class, and hidden mobile panel", async () => {
    const { container } = render(<UnifiedAssistant />);
    await act(async () => {});

    const launcher = desktopLauncher();
    expect(launcher).toHaveAttribute("aria-label", "Open AI chatbot");
    expect(launcher).toHaveClass("site-fab-launcher--assistant");
    expect(launcher).toHaveClass("assistant-floating-primary");
    expect(launcher).toHaveAttribute("type", "button");
    expect(screen.getAllByTestId("icon-sparkle").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(AI_CHATBOT_COPY.title)).toBeInTheDocument();

    expect(container.querySelector(".sm\\:hidden")).not.toBeNull();
    expect(screen.queryByRole("dialog", { name: "Guided planner" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "AI chatbot" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: MOBILE_ASSISTANT_COPY.planner })).not.toBeInTheDocument();
    expect(launcher).toHaveClass("site-fab-anchor--bottom");
  });

  it("toggles mobile launcher panel via aria-expanded and fires correct panel actions", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("max-width: 639px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<UnifiedAssistant />);
    await act(async () => {});

    const launcher = screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.launcher });
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(launcher).toHaveClass("assistant-floating-primary");
    expect(screen.getAllByTestId("icon-sparkle").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: MOBILE_ASSISTANT_COPY.planner })).not.toBeInTheDocument();

    fireEvent.click(launcher);
    expect(launcher).toHaveAttribute("aria-expanded", "true");
    const plannerBtn = screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.planner });
    const chatbotBtn = screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.chatbot });
    expect(plannerBtn).toHaveClass("assistant-launcher-action--dark");
    expect(chatbotBtn).toHaveClass("assistant-launcher-action--primary");
    expect(screen.getByTestId("icon-chat")).toBeInTheDocument();

    fireEvent.click(plannerBtn);
    expect(await screen.findByRole("dialog", { name: "Guided planner" })).toBeInTheDocument();
    expect(launcher).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(launcher);
    fireEvent.click(screen.getByRole("button", { name: MOBILE_ASSISTANT_COPY.chatbot }));
    expect(await screen.findByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: MOBILE_ASSISTANT_COPY.planner })).not.toBeInTheDocument();
  });

  it("opens guided planner via global event and chat via oando-chatbot:open with correct dialog semantics", async () => {
    render(<UnifiedAssistant />);
    await act(async () => {});

    expect(screen.queryByRole("dialog", { name: "Guided planner" })).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent("oando-assistant:open", { detail: { tab: "guided" } }));
    });
    const guidedDialog = await screen.findByRole("dialog", { name: "Guided planner" });
    expect(guidedDialog).toHaveAttribute("aria-modal", "true");
    expect(guidedDialog).toHaveClass("assistant-overlay");
    expect(within(guidedDialog).getByText(GUIDED_PLANNER_COPY.title)).toBeInTheDocument();
    expect(within(guidedDialog).getByText(GUIDED_PLANNER_COPY.subtitle)).toBeInTheDocument();
    expect(screen.getByTestId("icon-bot")).toBeInTheDocument();
    expect(within(guidedDialog).getByRole("button", { name: "Close guided planner" })).toHaveAttribute("type", "button");

    fireEvent.click(within(guidedDialog).getByRole("button", { name: "Close guided planner" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Guided planner" })).not.toBeInTheDocument());

    act(() => {
      window.dispatchEvent(new CustomEvent("oando-assistant:open", { detail: { tab: "ai" } }));
    });
    expect(await screen.findByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close AI chatbot" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "AI chatbot" })).not.toBeInTheDocument());

    act(() => {
      window.dispatchEvent(new CustomEvent("oando-chatbot:open"));
    });
    expect(await screen.findByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();
    expect(screen.getByText(AI_CHATBOT_COPY.subtitle)).toBeInTheDocument();
    expect(screen.getAllByTestId("icon-sparkle").length).toBeGreaterThanOrEqual(1);
  });

  it("closes chat then guided planner on Escape and ignores non-Escape keys", async () => {
    render(<UnifiedAssistant />);
    await act(async () => {});

    act(() => {
      window.dispatchEvent(new CustomEvent("oando-assistant:open", { detail: {} }));
    });
    await screen.findByRole("dialog", { name: "Guided planner" });

    fireEvent.click(screen.getByLabelText("Open AI chatbot"));
    const chatDialog = screen.getByRole("dialog", { name: "AI chatbot" });
    expect(chatDialog).toHaveAttribute("aria-label", "AI chatbot");
    expect(chatDialog).toHaveAttribute("aria-modal", "true");

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(screen.getByRole("dialog", { name: "AI chatbot" })).toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "AI chatbot" })).not.toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Guided planner" })).toBeInTheDocument();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Guided planner" })).not.toBeInTheDocument());
    expect(screen.queryByRole("dialog", { name: "AI chatbot" })).not.toBeInTheDocument();
  });

  it("exposes guided intake steps with computed placeholders and chip variant classes", async () => {
    render(<UnifiedAssistant />);
    await act(async () => {});
    act(() => {
      window.dispatchEvent(new CustomEvent("oando-assistant:open", { detail: {} }));
    });
    await screen.findByRole("dialog", { name: "Guided planner" });

    expect(screen.getByText(GUIDED_PLANNER_COPY.stepOneIntro)).toBeInTheDocument();
    const workstationChip = screen.getByRole("button", { name: "Workstations" });
    expect(workstationChip).toHaveClass("assistant-chip--idle");
    fireEvent.click(workstationChip);
    expect(workstationChip).toHaveClass("assistant-chip--selected");

    const seatsInput = screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.seats) as HTMLInputElement;
    expect(seatsInput).toHaveAttribute("placeholder", GUIDED_PLANNER_COPY.placeholders.seats);
    expect(seatsInput).toHaveClass("assistant-field");
    expect(seatsInput).toHaveAttribute("type", "text");
    fireEvent.change(seatsInput, { target: { value: "12" } });
    expect(seatsInput).toHaveValue("12");

    const continueBtn = screen.getByRole("button", { name: GUIDED_PLANNER_COPY.continue });
    expect(continueBtn).toHaveClass("assistant-primary-action");
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);
    expect(screen.getByText(GUIDED_PLANNER_COPY.stepTwoIntro)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.city)).toHaveAttribute("placeholder", GUIDED_PLANNER_COPY.placeholders.city);
    expect(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.budget)).toHaveClass("assistant-field");
    expect(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.notes)).toHaveClass("assistant-field--textarea");

    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.city), { target: { value: "Patna" } });
    const timelineChip = screen.getByRole("button", { name: "Exploring options" });
    expect(timelineChip).toHaveClass("assistant-chip--idle");
    fireEvent.click(timelineChip);
    expect(timelineChip).toHaveClass("assistant-chip--selected");

    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.continue }));
    expect(screen.getByText(GUIDED_PLANNER_COPY.stepThreeIntro)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.name)).toHaveAttribute("type", "text");
    expect(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.email)).toHaveAttribute("type", "email");
    expect(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.phone)).toHaveAttribute("type", "tel");

    const backBtn = screen.getByRole("button", { name: GUIDED_PLANNER_COPY.back });
    expect(backBtn).toHaveClass("assistant-text-action--muted");
    fireEvent.click(backBtn);
    expect(screen.getByText(GUIDED_PLANNER_COPY.stepTwoIntro)).toBeInTheDocument();
    expect(screen.queryByText(GUIDED_PLANNER_COPY.stepThreeIntro)).not.toBeInTheDocument();
  });

  it("completes guided intake via vi.fn with computed sourcePath and surfaces errors", async () => {
    mockPathname.mockReturnValue("/test-path");
    executeContactAction
      .mockResolvedValueOnce({ validationErrors: { email: ["required"] } })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { queryId: "lead-123", followUp: { email: null, whatsapp: null } } });

    render(<UnifiedAssistant />);
    await act(async () => {});
    act(() => {
      window.dispatchEvent(new CustomEvent("oando-assistant:open", { detail: {} }));
    });
    await screen.findByRole("dialog", { name: "Guided planner" });

    fireEvent.click(screen.getByRole("button", { name: "Workstations" }));
    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.seats), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.continue }));
    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.city), { target: { value: "Patna" } });
    fireEvent.click(screen.getByRole("button", { name: "Exploring options" }));
    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.continue }));
    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.name), { target: { value: "Anita" } });
    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.email), { target: { value: "anita@example.com" } });

    const finishBtn = screen.getByRole("button", { name: GUIDED_PLANNER_COPY.finish });
    expect(finishBtn).toHaveClass("assistant-primary-action");

    fireEvent.click(finishBtn);
    expect(await screen.findByText(GUIDED_PLANNER_COPY.errors.saveFailed)).toBeInTheDocument();
    expect(executeContactAction).toHaveBeenCalledTimes(1);
    expect(executeContactAction).toHaveBeenCalledWith(
      expect.objectContaining({ source: "homepage-chatbot", sourcePath: "/test-path", preferredContact: "email" }),
    );

    fireEvent.click(finishBtn);
    expect(await screen.findByText(GUIDED_PLANNER_COPY.errors.saveFailed)).toBeInTheDocument();
    expect(executeContactAction).toHaveBeenCalledTimes(2);

    fireEvent.change(screen.getByPlaceholderText(GUIDED_PLANNER_COPY.placeholders.phone), { target: { value: "+918888" } });
    fireEvent.click(finishBtn);
    await waitFor(() => expect(screen.getByText(GUIDED_PLANNER_COPY.submittedTitle)).toBeInTheDocument());
    expect(screen.getByText("Reference: lead-123")).toBeInTheDocument();
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
    const guidedDialog2 = screen.getByRole("dialog", { name: "Guided planner" });
    expect(within(guidedDialog2).getByRole("button", { name: GUIDED_PLANNER_COPY.submittedFollowUp })).toHaveClass("assistant-text-action");
    expect(within(guidedDialog2).getByRole("button", { name: GUIDED_PLANNER_COPY.submittedReset })).toHaveClass("assistant-text-action--muted");

    fireEvent.click(screen.getByRole("button", { name: GUIDED_PLANNER_COPY.submittedReset }));
    expect(screen.getByText(GUIDED_PLANNER_COPY.stepOneIntro)).toBeInTheDocument();
    expect(screen.queryByText("Reference: lead-123")).not.toBeInTheDocument();
  });

  it("submits chat via Enter, streams escaped summary, and renders computed product href", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (isCsrfUrl(input)) return okJson({ token: "csrf" });
      return ndjsonStream([
        "",
        JSON.stringify({ type: "delta", text: "plain text" }),
        JSON.stringify({ type: "delta", text: '{"summary":"Line\\nwith \\"quotes\\""}' }),
        JSON.stringify({
          type: "result",
          result: {
            recommendations: [{ productId: "prod-1", productName: "Ergo", category: "", why: "Support", budgetEstimate: "band" }],
            totalBudget: "on request",
            summary: "",
            nextActions: [],
            warnings: [],
            pricingMode: "on-request",
          },
        }),
      ]);
    });

    render(<UnifiedAssistant />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText("Open AI chatbot"));

    const dialog = screen.getByRole("dialog", { name: "AI chatbot" });
    expect(within(dialog).getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument();
    expect(within(dialog).getByText(AI_CHATBOT_COPY.subtitle)).toBeInTheDocument();

    for (const starter of AI_ASSISTANT_STARTERS) {
      expect(within(dialog).getByRole("button", { name: starter })).toHaveClass("assistant-choice-button");
    }
    expect(within(dialog).getByRole("button", { name: AI_ADVISOR_COPY.surpriseLabel })).toHaveClass("assistant-surprise-action");
    expect(screen.getByTestId("icon-wand")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(AI_CHATBOT_COPY.placeholder) as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute("placeholder", AI_CHATBOT_COPY.placeholder);
    expect(textarea).toHaveClass("assistant-field--textarea");
    expect(textarea).toHaveAttribute("rows", "2");

    const sendBtn = screen.getByRole("button", { name: AI_CHATBOT_COPY.send });
    expect(sendBtn).toHaveClass("assistant-primary-action--compact");
    expect(sendBtn).toBeDisabled();
    expect(screen.getByTestId("icon-send")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Need chairs" } });
    expect(textarea).toHaveValue("Need chairs");
    expect(sendBtn).not.toBeDisabled();

    const beforeShift = textarea.value;
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(textarea).toHaveValue(beforeShift);

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    await waitFor(() => expect(screen.getByText(AI_CHATBOT_COPY.summaryFallback)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/products//prod-1");
    expect(screen.getByRole("log", { name: "Assistant conversation" })).toHaveAttribute("aria-live", "polite");

    fireEvent.change(screen.getByPlaceholderText(AI_CHATBOT_COPY.placeholder), { target: { value: "Need tables" } });
    fireEvent.click(screen.getByRole("button", { name: AI_CHATBOT_COPY.send }));
    await waitFor(() => expect(screen.getAllByText(AI_CHATBOT_COPY.summaryFallback).length).toBeGreaterThanOrEqual(1));
  });

  it("renders refiners after first user message with computed hrefs and reset/switch actions", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (isCsrfUrl(input)) return okJson({ token: "csrf" });
      return ndjsonStream([
        JSON.stringify({
          type: "result",
          result: {
            recommendations: [{ productId: "prod-1", productName: "Ergo", category: "seating", productUrlKey: "ergo-chair", why: "Support", budgetEstimate: "band" }],
            totalBudget: "on request",
            summary: "Curated",
            nextActions: ["Confirm"],
            warnings: ["Lead time"],
            pricingMode: "band",
          },
        }),
      ]);
    });

    render(<UnifiedAssistant />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText("Open AI chatbot"));

    expect(screen.queryByRole("button", { name: AI_ASSISTANT_REFINERS[0].label })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: AI_CHATBOT_COPY.reset })).not.toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(AI_CHATBOT_COPY.placeholder);
    fireEvent.change(textarea, { target: { value: "Need chairs" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => expect(screen.getByText("Curated")).toBeInTheDocument());
    expect(screen.getByText(AI_CHATBOT_COPY.bandLabel)).toBeInTheDocument();
    expect(screen.getByText(AI_CHATBOT_COPY.warningsTitle)).toBeInTheDocument();
    expect(screen.getByText(AI_CHATBOT_COPY.nextActionsTitle)).toBeInTheDocument();

    for (const refiner of AI_ASSISTANT_REFINERS) {
      const btn = screen.getByRole("button", { name: refiner.label });
      expect(btn).toHaveClass("assistant-choice-button");
      expect(btn).toHaveAttribute("type", "button");
    }
    expect(screen.getByRole("button", { name: AI_CHATBOT_COPY.switchToPlanner })).toHaveClass("assistant-choice-button");
    const resetBtn = screen.getByRole("button", { name: AI_CHATBOT_COPY.reset });
    expect(resetBtn).toHaveClass("assistant-choice-button");

    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/products/seating/ergo-chair");

    fireEvent.click(resetBtn);
    await waitFor(() => expect(screen.getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument());
    expect(screen.queryByText("Curated")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: AI_ASSISTANT_REFINERS[0].label })).not.toBeInTheDocument();
  });

  it("handles fetch error and 10s timeout with aria-live error", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      if (isCsrfUrl(input)) return okJson({ token: "csrf" });
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });

    render(<UnifiedAssistant />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText("Open AI chatbot"));

    const textarea = screen.getByPlaceholderText(AI_CHATBOT_COPY.placeholder);
    fireEvent.change(textarea, { target: { value: "Need chairs" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => expect(screen.getAllByText(/timed out after 10 seconds/i).length).toBeGreaterThanOrEqual(1));
    const timeoutEl = screen.getAllByText(/timed out after 10 seconds/i).find((el) => el.closest("p")?.getAttribute("aria-live") === "polite") ?? screen.getAllByText(/timed out after 10 seconds/i)[0];
    expect(timeoutEl.closest("p") ?? timeoutEl).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByText(AI_CHATBOT_COPY.summaryFallback)).not.toBeInTheDocument();
  });

  it("reacts to oando-cookie-consent by restoring fab anchor and suppresses launcher on /products", async () => {
    mockHasConsentChoice.mockReturnValue(false);
    const { rerender } = render(<UnifiedAssistant />);
    await act(async () => {});

    const launcher = desktopLauncher();
    expect(launcher).toHaveClass("site-fab-anchor--bottom-raised");

    act(() => {
      window.dispatchEvent(new CustomEvent("oando-cookie-consent"));
    });
    expect(desktopLauncher()).toHaveClass("site-fab-anchor--bottom");
    expect(screen.queryByRole("dialog", { name: "AI chatbot" })).not.toBeInTheDocument();

    mockPathname.mockReturnValue("/products/seating");
    rerender(<UnifiedAssistant />);
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Open AI chatbot" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Open AI chatbot")).not.toBeInTheDocument();
  });
});
