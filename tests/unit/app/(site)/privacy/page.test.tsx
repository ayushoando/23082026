import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import enMessages from "@/i18n/messages/en.json";
import PrivacyPage from "@/app/(site)/privacy/page";

vi.mock("@/components/legal/LegalRouteHero", () => ({
  LegalRouteHero: () => <div data-testid="hero" />,
}));
vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="contact-teaser" />,
}));

describe("PrivacyPage", () => {
  it("renders the privacy locale contract", async () => {
    const page = await PrivacyPage();
    render(page);

    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("contact-teaser")).toBeInTheDocument();
    expect(
      screen.getByText(enMessages.legal.privacy.overviewTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enMessages.legal.privacy.commitments[0]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enMessages.legal.privacy.cookies.headers.category),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enMessages.legal.privacy.ctas.contactSupport),
    ).toBeInTheDocument();
  });
});
