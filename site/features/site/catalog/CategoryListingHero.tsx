"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";

import { MarketingImage } from "@/components/site/MarketingImage";

type CategoryListingHeroProps = {
  categoryName: string;
  description?: string;
  heroImage: { src: string; alt: string };
  subcategoryLinks: readonly string[];
  activeSubcategories: readonly string[];
  onSubcategoryToggle: (label: string) => void;
};

export function CategoryListingHero({
  categoryName,
  description,
  heroImage,
  subcategoryLinks,
  activeSubcategories,
  onSubcategoryToggle,
}: CategoryListingHeroProps) {
  return (
    <header className="catalog-category-hero" data-testid="category-listing-hero">
      <div className="catalog-category-hero__media">
        <MarketingImage
          src={heroImage.src}
          alt={heroImage.alt}
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="catalog-category-hero__img"
          priority
          fetchPriority="high"
        />
        <div className="catalog-category-hero__scrim" aria-hidden="true" />
      </div>
      <div className="catalog-category-hero__copy">
        <nav
          aria-label="Breadcrumb"
          data-testid="category-listing-breadcrumb"
          data-catalog-reveal
          className="catalog-category-hero__crumbs"
        >
          <Link href="/" className="catalog-category-hero__crumb">
            Home
          </Link>
          <CaretRight size={12} weight="bold" aria-hidden="true" />
          <Link href="/products" className="catalog-category-hero__crumb">
            Products
          </Link>
          <CaretRight size={12} weight="bold" aria-hidden="true" />
          <span className="catalog-category-hero__crumb is-current" aria-current="page">
            {categoryName}
          </span>
        </nav>
        <h1 data-catalog-reveal className="catalog-category-hero__title font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-heading">
          {categoryName}{" "}
          <span className="text-accent-italic italic text-primary">Collection</span>
        </h1>
        {description ? (
          <p data-catalog-reveal className="catalog-category-hero__lead page-copy text-body mt-3">
            {description}
          </p>
        ) : null}
        {subcategoryLinks.length > 0 ? (
          <div data-catalog-reveal className="catalog-category-hero__chips">
            {subcategoryLinks.map((label) => {
              const active = activeSubcategories.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  className={`catalog-category-hero__chip ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onSubcategoryToggle(label)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </header>
  );
}
