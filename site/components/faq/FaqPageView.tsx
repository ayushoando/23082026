"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Buildings,
  CaretDown,
  ChatCircleDots,
  Clock,
  MagnifyingGlass,
  ShieldCheck,
  Truck,
  X,
} from "@phosphor-icons/react";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { buildWhatsAppHref, SALES_PHONE_DIGITS } from "@/features/site/data/contact";

export type FaqItem = {
  q: string;
  a: string;
  category?: string;
};

export interface FaqPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  items: readonly FaqItem[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function FaqPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  items,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: FaqPageViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    if (items.length > 0) {
      return { [items[0].q]: true };
    }
    return {};
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) {
        cats.add(item.category);
      }
    });
    return ["All", ...Array.from(cats)];
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    items.forEach((item) => {
      const cat = item.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query) ||
        Boolean(item.category?.toLowerCase().includes(query))
      );
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <>
      <HomeSection variant="white" spacing="sm" className="border-t-0 pt-24 md:pt-28">
        <HomeSectionInner>
          <p className="home-kicker">{heroKicker}</p>
          <h1 className="home-heading mt-3">
            {`${heroTitleLead} ${heroTitleAccent}`}
          </h1>
          <p className="page-copy-sm text-muted mt-4 max-w-2xl">{heroSubtitle}</p>

          <div className="faq-page-wrapper">
            {/* Toolbar: Search + Category Filters */}
            <div className="faq-toolbar">
              <div className="faq-search-wrapper">
                <MagnifyingGlass
                  size={18}
                  weight="bold"
                  className="faq-search-icon"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g. delivery, warranty, CAD, installation)..."
                  className="faq-search-input"
                  aria-label="Search frequently asked questions"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="faq-search-clear"
                    aria-label="Clear search input"
                  >
                    <X size={16} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div
                className="faq-category-pills"
                role="tablist"
                aria-label="FAQ question categories"
              >
                {categories.map((cat) => {
                  const count = categoryCounts[cat] ?? 0;
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`faq-category-pill ${
                        isActive ? "faq-category-pill--active" : ""
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <span>{cat}</span>
                      <span className="faq-category-pill__count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout Grid: FAQ Accordion List + Support Sidebar */}
            <div className="faq-layout-grid">
              <div className="faq-main-column">
                <div className="faq-status-bar">
                  <span>
                    Showing {filteredItems.length}{" "}
                    {filteredItems.length === 1 ? "question" : "questions"}
                    {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
                    {searchQuery ? ` matching "${searchQuery}"` : ""}
                  </span>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="faq-empty-state">
                    <div className="faq-empty-state__icon">
                      <MagnifyingGlass size={32} weight="light" aria-hidden="true" />
                    </div>
                    <h2 className="faq-empty-state__title">No matching questions found</h2>
                    <p className="faq-empty-state__desc">
                      We couldn&apos;t find any questions matching &ldquo;{searchQuery}&rdquo;
                      {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}.
                      Try searching with different terms or contact our support desk.
                    </p>
                    <button
                      type="button"
                      className="faq-empty-state__reset-btn"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                      }}
                    >
                      Reset search &amp; filters
                    </button>
                  </div>
                ) : (
                  <div className="faq-list">
                    {filteredItems.map((item, idx) => {
                      const isOpen =
                        openItems[item.q] ?? (idx === 0 && !searchQuery);
                      return (
                        <details
                          key={item.q}
                          className="faq-card"
                          open={isOpen}
                          onToggle={(e) => {
                            const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
                            setOpenItems((prev) => ({ ...prev, [item.q]: nextOpen }));
                          }}
                        >
                          <summary className="faq-card__summary">
                            <div className="faq-card__header-content">
                              {item.category && (
                                <span className="faq-card__category-badge">
                                  {item.category}
                                </span>
                              )}
                              <span className="faq-card__question">{item.q}</span>
                            </div>
                            <span className="faq-card__caret-wrap" aria-hidden="true">
                              <CaretDown
                                size={18}
                                weight="bold"
                                className="faq-card__caret"
                              />
                            </span>
                          </summary>
                          <div className="faq-card__content">
                            <p className="faq-card__answer">{item.a}</p>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct Assistance Sidebar */}
              <aside className="faq-sidebar">
                <div className="faq-support-card">
                  <span className="faq-support-card__badge">Direct Assistance</span>
                  <h2 className="faq-support-card__title">
                    Have a specific project requirement?
                  </h2>
                  <p className="faq-support-card__desc">
                    Our workplace consultants and space planning engineers provide
                    personalized commercial quotations, CAD layouts, and timeline
                    schedules.
                  </p>
                  <ul className="faq-support-card__specs">
                    <li className="faq-support-card__spec-item">
                      <Clock
                        size={16}
                        weight="bold"
                        className="faq-support-card__spec-icon"
                        aria-hidden="true"
                      />
                      <span>7-day CAD space planning turnaround</span>
                    </li>
                    <li className="faq-support-card__spec-item">
                      <ShieldCheck
                        size={16}
                        weight="bold"
                        className="faq-support-card__spec-icon"
                        aria-hidden="true"
                      />
                      <span>2–5 year comprehensive warranty</span>
                    </li>
                    <li className="faq-support-card__spec-item">
                      <Truck
                        size={16}
                        weight="bold"
                        className="faq-support-card__spec-icon"
                        aria-hidden="true"
                      />
                      <span>Supervised delivery nationwide</span>
                    </li>
                    <li className="faq-support-card__spec-item">
                      <Buildings
                        size={16}
                        weight="bold"
                        className="faq-support-card__spec-icon"
                        aria-hidden="true"
                      />
                      <span>Corporate multi-floor rollout logistics</span>
                    </li>
                  </ul>

                  <div className="faq-support-card__actions">
                    <Link
                      href="/planning"
                      className="faq-support-card__btn faq-support-card__btn--primary"
                    >
                      <span>Start Planning Brief</span>
                      <ArrowRight size={16} weight="bold" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/contact"
                      className="faq-support-card__btn faq-support-card__btn--secondary"
                    >
                      <span>Contact Workplace Team</span>
                    </Link>
                    <a
                      href={buildWhatsAppHref(
                        "Hello, I have an office furniture procurement inquiry.",
                        SALES_PHONE_DIGITS,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="faq-support-card__btn faq-support-card__btn--whatsapp"
                    >
                      <ChatCircleDots size={16} weight="bold" aria-hidden="true" />
                      <span>WhatsApp Quick Chat</span>
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="sm">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={ctaKicker}
            title={
              <>
                {ctaTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{ctaTitleAccent}</span>
              </>
            }
            description={ctaDescription}
            actions={[
              { href: "/contact", label: ctaPrimary, variant: "primary" },
              { href: "/planning", label: ctaSecondary, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
