import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "@/app/(site)/contact/page";

const received: Record<string, unknown>[] = [];

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = Object.assign((key: string) => key, {
      raw: () => [{ title: "Patna HQ", lines: ["Fraser Road"] }],
    });
    return t;
  },
}));

vi.mock("@/components/contact/ContactPageView", () => ({
  ContactPageView: (props: Record<string, unknown>) => {
    received.push(props);
    return <div data-testid="ContactPageView" />;
  },
}));

describe("app/(site)/contact/page.tsx", () => {
  it("forwards intent and copy into ContactPageView", async () => {
    received.length = 0;
    const page = await Page({
      searchParams: Promise.resolve({ intent: "quote", source: "hero" }),
    });
    render(page);
    expect(screen.getByTestId("ContactPageView")).toBeInTheDocument();
    expect(received[0]).toMatchObject({
      intent: "quote",
      source: "hero",
      heroKicker: "heroKicker",
      offices: [{ title: "Patna HQ", lines: ["Fraser Road"] }],
    });
    const json = document.querySelectorAll('script[type="application/ld+json"]');
    expect(json.length).toBeGreaterThanOrEqual(1);
    expect(json[0]?.textContent).toContain("ContactPage");
  });
});
