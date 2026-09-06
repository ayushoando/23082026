"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { isLocale, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export interface LanguageSwitcherProps {
  /**
   * `header` — compact select for site chrome (desktop + drawer).
   * `footer` — labeled block for footer (default).
   */
  variant?: "header" | "footer";
  className?: string;
}

export function LanguageSwitcher({
  variant = "footer",
  className,
}: LanguageSwitcherProps) {
  const t = useTranslations("marketing.chrome.language");
  const reactId = useId();
  const selectId = `locale-switcher-${variant}-${reactId}`;
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const languageNames: Record<Locale, string> = {
    en: t("english"),
    hi: t("hindi"),
  };
  const languageNamesFull: Record<Locale, string> = {
    en: t("english"),
    hi: t("hindiFull"),
  };

  useEffect(() => {
    const pathname = (typeof window !== "undefined" ? window.location?.pathname : "") || "";
    const isHindiPath = pathname === "/hi" || pathname.startsWith("/hi/");
    if (isHindiPath) {
      setCurrentLocale("hi");
    } else {
      const match = document.cookie.match(/(^|;)\s*NEXT_LOCALE\s*=\s*([^;]+)/);
      const cookieLocale = match?.[2];
      if (isLocale(cookieLocale)) {
        setCurrentLocale(cookieLocale);
      }
    }
  }, []);

  const applyLocale = (nextLocale: string) => {
    if (!isLocale(nextLocale) || nextLocale === currentLocale) {
      return;
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    setCurrentLocale(nextLocale);

    const currentPath = typeof window.location.pathname === "string" ? window.location.pathname : "/";
    const search = typeof window.location.search === "string" ? window.location.search : "";
    let targetPath: string;

    if (nextLocale === "hi") {
      const cleanPath = currentPath.replace(/^\/hi(\/|$)/, "/");
      targetPath = cleanPath === "/" ? "/hi" : `/hi${cleanPath}`;
    } else {
      const stripped = currentPath.replace(/^\/hi(\/|$)/, "$1");
      targetPath = stripped || "/";
    }

    const nextUrl = `${targetPath}${search}`;
    if (typeof window.location.assign === "function") {
      window.location.assign(nextUrl);
    } else {
      try {
        window.location.href = nextUrl;
      } catch {
        // Fallback for environments where location.href assignment is restricted
      }
      if (typeof window.location.reload === "function") {
        window.location.reload();
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    applyLocale(event.target.value);
  };

  const names = variant === "header" ? languageNames : languageNamesFull;

  if (variant === "header") {
    return (
      <div
        className={cn("site-header__locale inline-flex min-w-0 shrink", className)}
        role="group"
        aria-label={t("label")}
      >
        <button
          type="button"
          aria-pressed={currentLocale === "en"}
          aria-label={t("english")}
          onClick={() => applyLocale("en")}
          className={cn(
            "site-header__locale-btn site-header__locale-btn--en touch-manipulation rounded-l-full border border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            currentLocale === "en"
              ? "border-primary bg-panel text-strong"
              : "bg-transparent text-muted hover:text-strong",
          )}
        >
          EN
        </button>
        <button
          type="button"
          aria-pressed={currentLocale === "hi"}
          aria-label={t("hindi")}
          onClick={() => applyLocale("hi")}
          className={cn(
            "site-header__locale-btn site-header__locale-btn--hi -ms-px touch-manipulation rounded-r-full border border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            currentLocale === "hi"
              ? "border-primary bg-panel text-strong"
              : "bg-transparent text-muted hover:text-strong",
          )}
        >
          HI
        </button>
      </div>
    );
  }

  return (
    <div className={cn("mt-2 flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={selectId} className="typ-label text-inverse-muted">
        {t("label")}
      </label>
      <select
        id={selectId}
        value={currentLocale}
        onChange={handleChange}
        aria-label={t("label")}
        className="site-footer__locale-select min-h-11 w-40 max-w-full cursor-pointer touch-manipulation rounded border px-2.5 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {Object.entries(names).map(([code, name]) => (
          <option key={code} value={code} className="bg-panel text-strong">
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
