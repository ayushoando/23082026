"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import type { RefObject } from "react";

import {
  headerSearchBadgeClass,
  headerSearchKindClass,
  headerSearchMetaClass,
  headerSearchPanelClass,
  headerSearchShellClass,
  type NavSearchMode,
  type NavSearchResult,
} from "@/components/site/headerSearchTypes";

type HeaderSearchPanelProps = {
  searchPanelRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  showSearchPanel: boolean;
  onShowSearchPanel: (open: boolean) => void;
  searchResults: NavSearchResult[];
  searchLoading: boolean;
  searchSource: NavSearchMode | null;
  searchSectionTitle: string;
  searchStatusAnnouncement: string;
  onSearchResultClick: () => void;
  onSubmitSearch: () => void;
  onMouseEnter: () => void;
};

export function HeaderSearchPanel({
  searchPanelRef,
  searchQuery,
  onSearchQueryChange,
  showSearchPanel,
  onShowSearchPanel,
  searchResults,
  searchLoading,
  searchSource,
  searchSectionTitle,
  searchStatusAnnouncement,
  onSearchResultClick,
  onSubmitSearch,
  onMouseEnter,
}: HeaderSearchPanelProps) {
  const t = useTranslations("marketing.chrome.search");

  return (
    <div
      ref={searchPanelRef}
      className="site-header__search relative min-w-0"
      onMouseEnter={onMouseEnter}
    >
      <form
        className={headerSearchShellClass}
        role="search"
        aria-label={t("formLabel")}
        suppressHydrationWarning
        toolname="searchProducts"
        tooldescription="Search the One&Only product catalog by keyword (chairs, workstations, tables, storage)."
        toolautosubmit=""
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch();
        }}
      >
        <label htmlFor="site-header-search" className="sr-only">
          {t("inputLabel")}
        </label>
        <MagnifyingGlass size={12} weight="bold" className="text-muted" aria-hidden="true" />
        <input
          id="site-header-search"
          name="search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onFocus={() => onShowSearchPanel(true)}
          placeholder={t("placeholder")}
          data-caret={showSearchPanel ? "visible" : "hidden"}
          className={`site-header-search-input min-w-0 bg-transparent typ-body outline-none placeholder:text-subtle ${showSearchPanel ? "caret-visible" : "caret-transparent"}`}
          autoComplete="off"
          aria-label={t("inputLabel")}
          aria-describedby="site-header-search-status"
          aria-controls={showSearchPanel ? "site-header-search-panel" : undefined}
          suppressHydrationWarning
          toolparamdescription="Product search keywords, for example ergonomic chair or modular workstation."
        />
        <Sparkle size={12} weight="duotone" className="text-contrast-accent" aria-hidden="true" />
        <button type="submit" className="sr-only">
          {t("submit")}
        </button>
      </form>
      <p id="site-header-search-status" className="sr-only" role="status" aria-live="polite">
        {searchStatusAnnouncement}
      </p>

      {showSearchPanel ? (
        <div
          id="site-header-search-panel"
          className={`${headerSearchPanelClass} site-header-flyout animate-in fade-in slide-in-from-top-2 duration-300`}
        >
          <div className={headerSearchMetaClass}>
            <span>{searchSectionTitle}</span>
            {searchSource ? (
              <span className={headerSearchBadgeClass}>
                {searchSource === "ai"
                  ? t("aiRanked")
                  : searchSource === "static-fallback"
                    ? t("staticFallback")
                    : t("localSearch")}
              </span>
            ) : null}
          </div>
          {searchLoading ? (
            <p className="py-6 typ-body text-muted">{t("searching")}</p>
          ) : searchResults.length > 0 ? (
            <ul className="space-y-1">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={onSearchResultClick}
                    className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2.5 typ-body"
                  >
                    <span>{result.title}</span>
                    <span className={headerSearchKindClass}>{result.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-1 py-2">
              <Link
                href="/products"
                onClick={onSearchResultClick}
                className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2 typ-body"
              >
                {t("allProducts")}
              </Link>
              <Link
                href="/solutions"
                onClick={onSearchResultClick}
                className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2 typ-body"
              >
                {t("solutions")}
              </Link>
              <Link
                href="/portfolio"
                onClick={onSearchResultClick}
                className="shell-list-link flex items-center justify-between rounded-xl px-3 py-2 typ-body"
              >
                {t("portfolio")}
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
