"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** Full labels for footer / mobile drawer. */
const LANGUAGE_NAMES_FULL: Record<string, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
};

export type LanguageSwitcherProps = {
  /**
   * `header` — compact select for site chrome (desktop + drawer).
   * `footer` — labeled block for footer (default).
   */
  variant?: "header" | "footer";
  className?: string;
};

export function LanguageSwitcher({
  variant = "footer",
  className,
}: LanguageSwitcherProps) {
  const reactId = useId();
  const selectId = `locale-switcher-${variant}-${reactId}`;
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    function syncFromCookie() {
      const match = document.cookie.match(/(^|;)\s*NEXT_LOCALE\s*=\s*([^;]+)/);
      if (match) {
        setCurrentLocale(match[2]);
      }
    }
    syncFromCookie();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    // Secure flag on HTTPS (SITE-S20 / 8.3) — cookie never sent over plain http.
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    setCurrentLocale(nextLocale);
    window.location.reload();
  };

  const names = variant === "header" ? LANGUAGE_NAMES : LANGUAGE_NAMES_FULL;

  if (variant === "header") {
    return (
      <div className={cn("site-header__locale min-w-0 shrink", className)}>
        <label htmlFor={selectId} className="sr-only">
          Select Language
        </label>
        <select
          id={selectId}
          value={currentLocale}
          onChange={handleChange}
          aria-label="Select Language"
          className="site-header__locale-select typ-nav min-h-11 max-w-[6.75rem] cursor-pointer touch-manipulation rounded-full border border-soft bg-panel px-2.5 py-2 font-semibold text-strong shadow-none transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:max-w-[8.5rem] sm:px-3"
        >
          {Object.entries(names).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn("mt-2 flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={selectId} className="typ-label text-inverse-muted">
        Select Language
      </label>
      <select
        id={selectId}
        value={currentLocale}
        onChange={handleChange}
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
