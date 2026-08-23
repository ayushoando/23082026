import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Reviews } from "@/components/Reviews";

vi.mock("@phosphor-icons/react", () => ({
  Star: ({ className }: { className?: string }) => (
    <span className={className} data-testid="mock-star" />
  ),
}));

describe("Reviews — behavior", () => {
  const initialReviews = [
    { id: "1", user_name: "John Doe", rating: 4, comment: "Great product", created_at: "2026-01-01T00:00:00.000Z" },
    { id: "2", user_name: "Jane Smith", rating: 5, comment: "Amazing quality", created_at: "2026-01-02T00:00:00.000Z" },
  ] as const;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders hero kicker, heading hierarchy, copy, and summary aria-label with computed avg and count", () => {
    const { container } = render(<Reviews productId="prod_1" initialReviews={[...initialReviews]} />);

    expect(screen.getByText("Customer Reviews")).toBeInTheDocument();
    expect(screen.getByText("Customer Reviews")).toHaveClass("pdp-reviews-kicker");

    const heading = screen.getByRole("heading", { level: 3, name: "Client feedback" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("home-heading");
    expect(screen.getByText(/Decision-makers use this section/i)).toBeInTheDocument();

    // Average 4.5 from (4+5)/2 — summary region computed aria-label
    expect(screen.getByLabelText("Average rating 4.5 from 2 reviews")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toHaveClass("font-semibold");
    expect(screen.getByText("2 reviews")).toBeInTheDocument();
    expect(screen.getByText("2 reviews")).toHaveClass("pdp-reviews-count");

    // Shell and stars aria-hidden
    expect(container.querySelector(".pdp-reviews-shell")).not.toBeNull();
    const stars = screen.getAllByTestId("mock-star");
    expect(stars.length).toBeGreaterThanOrEqual(5);
    // Summary stars: first 5 with fill-current for rounded avg 5 (4.5 rounds to 5)
    for (const star of stars.slice(0, 5)) {
      expect(star).toHaveClass("h-4");
    }

    expect(screen.getByText("Write a review")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Add a practical note" })).toBeInTheDocument();
    expect(screen.getByText(/Focus on comfort/i)).toBeInTheDocument();
    expect(screen.queryByText("No reviews yet.")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /nonexistent/i })).not.toBeInTheDocument();
  });

  it("iterates initial reviews from source-of-truth with names, comments, dates, and per-review star variants", () => {
    const { container } = render(<Reviews productId="prod_1" initialReviews={[...initialReviews]} />);

    for (const review of initialReviews) {
      expect(screen.getByText(review.user_name)).toBeInTheDocument();
      expect(screen.getByText(review.comment)).toBeInTheDocument();
      // Date is locale formatted — verify year present via created_at substring
      const expectedDate = new Date(review.created_at).toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
      expect(screen.getByLabelText(`${review.rating} out of 5 stars`)).toBeInTheDocument();
    }

    const articles = container.querySelectorAll(".pdp-reviews-item");
    expect(articles).toHaveLength(initialReviews.length);
    for (const article of articles) {
      expect(article).toHaveClass("pdp-reviews-item");
      // Each article's star row uses h-3.5 for review items
      const reviewStars = article.querySelectorAll('[data-testid="mock-star"]');
      expect(reviewStars.length).toBe(5);
    }

    // John Doe 4 stars -> 4 fill-current in his row, Jane 5 -> 5 fill-current
    const johnArticle = screen.getByText("John Doe").closest("article") as HTMLElement;
    expect(within(johnArticle).getAllByTestId("mock-star").filter((el) => el.className.includes("fill-current"))).toHaveLength(4);
    const janeArticle = screen.getByText("Jane Smith").closest("article") as HTMLElement;
    expect(within(janeArticle).getAllByTestId("mock-star").filter((el) => el.className.includes("fill-current"))).toHaveLength(5);
  });

  it("renders empty state with absence of articles and 0.0/0 reviews when no initialReviews", () => {
    const { container } = render(<Reviews productId="prod_1" initialReviews={[]} />);

    expect(screen.getByText("0.0")).toBeInTheDocument();
    expect(screen.getByText("0 reviews")).toBeInTheDocument();
    expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
    expect(screen.getByText(/The first project note should mention/i)).toBeInTheDocument();
    expect(container.querySelectorAll(".pdp-reviews-item")).toHaveLength(0);
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Average rating 0.0 from 0 reviews")).toBeInTheDocument();
  });

  it("selects rating 1..5 via buttons with aria-pressed and fill-current class variant", () => {
    render(<Reviews productId="prod_1" initialReviews={[]} />);

    const group = screen.getByRole("group", { name: "Rating" });
    expect(group).toHaveAttribute("aria-labelledby", "review-rating-label");
    expect(group).toHaveAttribute("aria-label", "Selected rating 5 of 5");

    const buttons = screen.getAllByRole("button", { name: /Rate \d stars/ });
    expect(buttons).toHaveLength(5);
    // Default rating 5 -> button 5 pressed, all stars fill-current while rating is 5 (val <= rating)
    expect(buttons[4]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
    for (const btn of buttons) {
      expect(btn.querySelector('[data-testid="mock-star"]')).toHaveClass("fill-current");
    }

    for (let idx = 0; idx < 5; idx += 1) {
      fireEvent.click(buttons[idx]);
      expect(buttons[idx]).toHaveAttribute("aria-pressed", "true");
      // Only clicked is true, others false
      for (let j = 0; j < 5; j += 1) {
        expect(buttons[j]).toHaveAttribute("aria-pressed", String(j === idx));
      }
      expect(screen.getByLabelText(`Selected rating ${idx + 1} of 5`)).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Rating" })).toHaveAttribute("aria-label", `Selected rating ${idx + 1} of 5`);
    }

    // Back to 4 for submit test
    fireEvent.click(buttons[3]);
    expect(buttons[3]).toHaveAttribute("aria-pressed", "true");
  });

  it("validates form inputs with labels, required, autocomplete, and counts", () => {
    const { container } = render(<Reviews productId="prod_1" initialReviews={[]} />);

    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const reviewInput = screen.getByLabelText("Review") as HTMLTextAreaElement;

    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("id", "userName");
    expect(nameInput).toHaveAttribute("name", "userName");
    expect(nameInput).toHaveAttribute("autocomplete", "name");
    expect(nameInput).toHaveAttribute("required", "");
    expect(nameInput).toHaveClass("pdp-reviews-input");
    expect(nameInput).toHaveValue("");

    expect(reviewInput).toBeInTheDocument();
    expect(reviewInput).toHaveAttribute("id", "comment");
    expect(reviewInput).toHaveAttribute("name", "comment");
    expect(reviewInput).toHaveAttribute("rows", "5");
    expect(reviewInput).toHaveClass("pdp-reviews-input--textarea");

    expect(screen.getByText("Rating")).toHaveAttribute("id", "review-rating-label");

    const form = container.querySelector('form[toolname="submitProductReview"]') as HTMLFormElement | null;
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("tooldescription", expect.stringContaining("star rating") as unknown as string);

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    expect(submitBtn).toHaveAttribute("type", "submit");
    expect(submitBtn).toHaveClass("pdp-reviews-submit");
    expect(submitBtn).not.toBeDisabled();
  });

  it("does not submit when required name/comment missing — no isSubmitting, no new article", async () => {
    render(<Reviews productId="prod_1" initialReviews={[]} />);

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    expect(screen.queryByText("Submitting...")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument();
    expect(screen.getByText("0.0")).toBeInTheDocument();

    // Only comment without name -> still blocked (early return in handleSubmit, textarea keeps value, no article)
    fireEvent.change(screen.getByLabelText("Review"), { target: { value: "Only comment" } });
    expect(screen.getByLabelText("Review")).toHaveValue("Only comment");
    fireEvent.click(submitBtn);
    // Flush any microtask that handleSubmit would have started
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.queryByText("Submitting...")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument();
    expect(screen.getByText("0.0")).toBeInTheDocument();
    expect(screen.getByText("0 reviews")).toBeInTheDocument();
  });

  it("submits review with fireEvent, advances fake timers, asserts count+args via DOM and clears fields", async () => {
    const { container } = render(<Reviews productId="prod_1" initialReviews={[]} />);

    const starButtons = screen.getAllByRole("button", { name: /Rate \d stars/ });
    fireEvent.click(starButtons[3]); // rating 4
    expect(starButtons[3]).toHaveAttribute("aria-pressed", "true");

    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const commentInput = screen.getByLabelText("Review") as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: "Alice Johnson" } });
    fireEvent.change(commentInput, { target: { value: "Excellent comfort and design." } });
    expect(nameInput).toHaveValue("Alice Johnson");
    expect(commentInput).toHaveValue("Excellent comfort and design.");

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Submitting...")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent("Submitting...");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // New review prepended as first article
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Excellent comfort and design.")).toBeInTheDocument();
    expect(screen.getByText("4.0")).toBeInTheDocument();
    expect(screen.getByText("1 reviews")).toBeInTheDocument();
    expect(screen.getByLabelText("Average rating 4.0 from 1 reviews")).toBeInTheDocument();
    expect(screen.queryByText("No reviews yet.")).not.toBeInTheDocument();
    expect(screen.queryByText("Submitting...")).not.toBeInTheDocument();

    // First article is the newly inserted Alice review
    const articles = container.querySelectorAll(".pdp-reviews-item");
    expect(articles).toHaveLength(1);
    expect(articles[0]).toHaveTextContent("Alice Johnson");
    expect(within(articles[0] as HTMLElement).getByLabelText("4 out of 5 stars")).toBeInTheDocument();

    // Fields cleared and rating reset to 5
    expect(nameInput).toHaveValue("");
    expect(commentInput).toHaveValue("");
    expect(starButtons[4]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Selected rating 5 of 5")).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
    expect(submitBtn).toHaveTextContent("Submit Review");
  });

  it("stacks reviews and recomputes average — iteration over source-of-truth remains monotonic", async () => {
    render(<Reviews productId="prod_1" initialReviews={[...initialReviews]} />);

    // Start 2 reviews avg 4.5, add rating 5 -> 3 reviews avg (4+5+5)/3 = 4.7
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const commentInput = screen.getByLabelText("Review") as HTMLTextAreaElement;
    const starButtons = screen.getAllByRole("button", { name: /Rate \d stars/ });

    // Rating already 5 by default, no click needed
    expect(starButtons[4]).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(nameInput, { target: { value: "Bob Lee" } });
    fireEvent.change(commentInput, { target: { value: "Sturdy and ergonomic." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Bob Lee")).toBeInTheDocument();
    expect(screen.getByText("Sturdy and ergonomic.")).toBeInTheDocument();
    expect(screen.getByText("3 reviews")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByLabelText("Average rating 4.7 from 3 reviews")).toBeInTheDocument();

    // All three names present via source-of-truth iteration
    for (const name of ["Bob Lee", "John Doe", "Jane Smith"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryByText("No reviews yet.")).not.toBeInTheDocument();
  });
});
