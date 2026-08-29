import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AI_ASSISTANT_WELCOME_MESSAGE } from "@/features/site/data/assistant";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/consent", () => ({
  hasConsentChoice: () => true,
}));

vi.mock("@/features/site/assistant/UnifiedAssistant", () => ({
  UnifiedAssistant: () => (
    <div>
      <button type="button" aria-label="Open AI chatbot">Open assistant</button>
      <p>Hi, I am your workspace AI assistant. Share your requirement and I will suggest practical options.</p>
    </div>
  ),
}));

import DynamicBotWrapper from "@/features/site/assistant/DynamicBotWrapper";

describe("DynamicBotWrapper", () => {
  it("renders the lazily loaded unified assistant", async () => {
    render(<DynamicBotWrapper />);
    expect(
      await screen.findByRole("button", { name: /open ai chatbot/i }),
    ).toBeInTheDocument();
  });

  it("loads assistant content when the chatbot is opened", async () => {
    render(<DynamicBotWrapper />);
    fireEvent.click(await screen.findByRole("button", { name: /open ai chatbot/i }));

    expect(screen.getByText(AI_ASSISTANT_WELCOME_MESSAGE)).toBeInTheDocument();
  });
});
