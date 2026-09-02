"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { CaretDown, MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { SITE_HEADER_MORE_LINKS, SITE_HEADER_PRIMARY_LINKS } from "@/features/site/data/navigation";
import { isPlannerEntryHref } from "@/lib/analytics/plannerEntry";
import { trackSiteSearchSubmitted } from "@/lib/analytics/siteEvents";
import {
  NAV_CATEGORY_GROUP_ORDER,
  NAV_CATEGORY_GROUPS,
} from "@/lib/navigation";

interface NavSearchResult {
  id: string;
  title: string;
  href: string;
  type: "product" | "category" | "page";
  source: "ai" | "local";
}

async function resolveSearchDestination(
  query: string,
  context: "header" | "mobile",
  currentResults: NavSearchResult[],
) {
  if (currentResults[0]?.href) {
    return currentResults[0].href;
  }

  if (query.length < 2) {
    return "/products";
  }

  try {
    const response = await fetch(
      `/api/nav-search/?q=${encodeURIComponent(query)}&limit=1&context=${context}`,
    );
    if (!response.ok) {
      return "/products";
    }
    const payload = (await response.json()) as { results?: NavSearchResult[] };
    return payload.results?.[0]?.href || "/products";
  } catch {
    return "/products";
  }
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_SHORTCUTS = [
  { href: "/products?sort=new-arrivals", translationKey: "mobile.newArrivals" },
  { href: "/products?filter=best-sellers", translationKey: "mobile.bestSellers" },
  { href: "/contact", translationKey: "navigation.contact" },
] as const;

const NAVIGATION_LABEL_KEYS: Record<string, string> = {
  Products: "products",
  Solutions: "solutions",
  Portfolio: "portfolio",
  Planner: "planner",
  About: "about",
  Contact: "contact",
  Planning: "planning",
  Showrooms: "showrooms",
  "Trusted By": "trustedBy",
  Careers: "careers",
  "After Sales": "afterSales",
  Downloads: "downloads",
  Sustainability: "sustainability",
  FAQ: "faq",
};

const drawerSearchClass =
  "shell-glass-panel flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2.5 touch-manipulation";
const drawerLinkClass =
  "shell-list-link flex min-h-11 w-full min-w-0 items-center rounded-xl px-3 font-normal text-strong touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [font-size:var(--type-body-size)]";
const drawerSearchResultClass =
  "shell-list-link flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-panel px-3 py-2 text-sm text-body touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const drawerSearchNoteClass = "shell-search-meta";
const drawerCountClass = "shell-search-meta shrink-0";

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const t = useTranslations("marketing.chrome");
  const navigationLabel = (label: string) =>
    t(`navigation.${NAVIGATION_LABEL_KEYS[label] ?? label}`);
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open) {return;}
    closeBtnRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) {return;}
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const appMain = document.querySelector<HTMLElement>(".mobile-app-main");
    const prevMainOverflow = appMain?.style.overflow ?? "";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflowX = "clip";
    if (appMain) {
      appMain.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflowX = prevHtmlOverflowX;
      if (appMain) {
        appMain.style.overflow = prevMainOverflow;
      }
    };
  }, [open]);

  useEffect(() => {
    function resetSearchState() {
      setSearchQuery("");
      setSearchResults([]);
      setSearchLoading(false);
      setShowSearchPanel(false);
      setProductsOpen(false);
    }
    if (!open) {
      resetSearchState();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {return;}

    // Escape-to-close only. Focus containment (Tab cycling) is owned by the
    // react-aria-components Modal that already wraps this drawer — exactly one
    // trap mechanism per component, so the two cannot drift apart.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {return;}
    const query = searchQuery.trim();

    function clearResults() {
      setSearchResults([]);
      setSearchLoading(false);
    }

    if (query.length < 2) {
      clearResults();
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch("/api/nav-search/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit: 8, context: "mobile" }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          results?: NavSearchResult[];
        };

        if (!response.ok) {
          setSearchResults([]);
          return;
        }
        setSearchResults(Array.isArray(payload.results) ? payload.results : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 260);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, searchQuery]);

  const handleClose = () => {
    onClose();
  };

  const onSearchResultClick = () => {
    setShowSearchPanel(false);
    setSearchQuery("");
    handleClose();
  };

  const submitSearch = async () => {
    const query = searchQuery.trim();
    const destination = await resolveSearchDestination(query, "mobile", searchResults);
    trackSiteSearchSubmitted({
      pathname: window.location.pathname,
      surface: "mobile",
      queryLength: query.length,
      destination,
    });
    router.push(destination);
    setShowSearchPanel(false);
    setSearchQuery("");
    handleClose();
  };

  const searchStatusAnnouncement = !searchQuery.trim()
    ? t("search.typeAtLeastTwo")
    : searchLoading
      ? t("search.searchingProducts")
      : searchResults.length > 0
        ? t("search.results")
        : t("search.noSearchResults");

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {handleClose();}
      }}
      isDismissable
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
    >
      <Modal className="fixed inset-y-0 right-0 z-[70] outline-none">
        <Dialog
          aria-label={t("mobile.primaryNavigation")}
          className="outline-none"
        >
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            className="flex h-full w-[min(92vw,28rem)] max-w-[100vw] flex-col overflow-hidden overscroll-contain bg-panel text-strong pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-soft px-4 py-3 sm:px-5 sm:py-4">
            <OneAndOnlyLogo className="h-8 min-w-0 max-w-[10rem]" variant="orange" />
            <LanguageSwitcher variant="header" />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleClose}
              aria-label={t("header.closeNavigation")}
              className="shell-icon-button inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 touch-manipulation text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

        <nav
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
          aria-label={t("mobile.primaryNavigation")}
        >
          <div className="mb-4 min-w-0">
            <form
              className={drawerSearchClass}
              role="search"
              aria-label={t("mobile.searchForm")}
              toolname="searchProductsMobile"
              tooldescription="Search the One&Only product catalog from the mobile navigation drawer."
              toolautosubmit=""
              onSubmit={(event) => {
                event.preventDefault();
                void submitSearch();
              }}
            >
              <MagnifyingGlass size={16} weight="bold" className="shrink-0 text-muted" aria-hidden="true" />
              <label htmlFor="mobile-nav-search" className="sr-only">
                {t("mobile.searchProducts")}
              </label>
              <input
                id="mobile-nav-search"
                name="search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setShowSearchPanel(true)}
                placeholder={t("search.placeholder")}
                className="min-w-0 w-full bg-transparent text-sm text-strong outline-none placeholder:text-subtle"
                autoComplete="off"
                aria-label={t("mobile.searchProducts")}
                aria-describedby="mobile-nav-search-status"
                toolparamdescription="Product search keywords, for example ergonomic chair or modular workstation."
              />
              <Sparkle size={16} weight="duotone" className="shrink-0 text-accent1" aria-hidden="true" />
              <button type="submit" className="sr-only">
                {t("mobile.submitSearch")}
              </button>
            </form>
            <p id="mobile-nav-search-status" className="sr-only" role="status" aria-live="polite">
              {searchStatusAnnouncement}
            </p>

            {(showSearchPanel || searchQuery.trim().length >= 2) && (
              <div
                id="mobile-nav-search-panel"
                className="shell-floating-panel-soft mt-2 min-w-0 overflow-hidden rounded-2xl p-3"
              >
                <p className={drawerSearchNoteClass}>
                  {searchLoading
                    ? t("search.searching")
                    : searchResults.length > 0
                      ? t("search.results")
                      : t("search.noResults")}
                </p>
                {searchLoading ? (
                  <p className="text-sm text-muted">{t("search.searching")}</p>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-1">
                    {searchResults.map((result) => (
                      <li key={result.id} className="min-w-0">
                        <Link
                          href={result.href}
                          onClick={onSearchResultClick}
                          className={drawerSearchResultClass}
                        >
                          <span className="min-w-0 truncate">{result.title}</span>
                          <span className={drawerCountClass}>
                            {result.type}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">
                    {t("search.typeAtLeastTwo")}
                  </p>
                )}
              </div>
            )}
          </div>

          <ul className="drawer-primary min-w-0 space-y-1">
            {SITE_HEADER_PRIMARY_LINKS.map((link) => {
              const hasMega = "hasMega" in link && link.hasMega;
              const label = navigationLabel(link.label);
              if (hasMega) {
                return (
                  <li key={link.label}>
                    <button
                      type="button"
                      aria-expanded={productsOpen}
                      aria-controls="mobile-nav-products"
                      onClick={() => setProductsOpen((open) => !open)}
                      className={`${drawerLinkClass} justify-between`}
                    >
                      {label}
                      <CaretDown
                        size={16}
                        weight="bold"
                        aria-hidden="true"
                        className={productsOpen ? "rotate-180" : undefined}
                      />
                    </button>
                    {productsOpen ? (
                      <ul id="mobile-nav-products" className="mt-1 space-y-1 ps-3">
                        <li>
                          <TrackedLink
                            href="/products"
                            label={t("navigation.allProducts")}
                            surface="mobile-nav"
                            className={drawerLinkClass}
                            onClick={handleClose}
                          >
                            {t("navigation.allProducts")}
                          </TrackedLink>
                        </li>
                        {NAV_CATEGORY_GROUP_ORDER.map((groupId) => (
                          <li key={groupId}>
                            <TrackedLink
                              href={`/products/${groupId}`}
                              label={NAV_CATEGORY_GROUPS[groupId].label}
                              surface="mobile-nav"
                              className={drawerLinkClass}
                              onClick={handleClose}
                            >
                              {NAV_CATEGORY_GROUPS[groupId].label}
                            </TrackedLink>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              }

              if (isPlannerEntryHref(link.href)) {
                return (
                  <li key={link.label}>
                    <PlannerLaunchLink
                      href={link.href}
                      surface="mobile-nav"
                      label={label}
                      className={drawerLinkClass}
                      onClick={handleClose}
                    >
                      {label}
                    </PlannerLaunchLink>
                  </li>
                );
              }

              return (
                <li key={link.label}>
                  <TrackedLink
                    href={link.href}
                    label={label}
                    surface="mobile-nav"
                    className={drawerLinkClass}
                    onClick={handleClose}
                  >
                    {label}
                  </TrackedLink>
                </li>
              );
            })}
          </ul>

          {SITE_HEADER_MORE_LINKS.length > 0 ? (
          <ul className="drawer-more mt-4 min-w-0 space-y-1">
            {SITE_HEADER_MORE_LINKS.map((link) => {
              const label = navigationLabel(link.label);
              return (
                <li key={link.href}>
                  <TrackedLink
                    href={link.href}
                    label={label}
                    surface="mobile-nav"
                    className={drawerLinkClass}
                    onClick={handleClose}
                  >
                    {label}
                  </TrackedLink>
                </li>
              );
            })}
          </ul>
          ) : null}

          <ul className="drawer-shortcuts mt-4 min-w-0 space-y-1">
            {DRAWER_SHORTCUTS.map((link) => (
              <li key={link.href}>
                <TrackedLink
                  href={link.href}
                  label={t(link.translationKey)}
                  surface="mobile-nav"
                  className={drawerLinkClass}
                  onClick={handleClose}
                >
                  {t(link.translationKey)}
                </TrackedLink>
              </li>
            ))}
          </ul>
        </nav>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
