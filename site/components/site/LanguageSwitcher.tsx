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
    function syncFromCookie() {
      const match = document.cookie.match(/(^|;)\s*NEXT_LOCALE\s*=\s*([^;]+)/);
      const cookieLocale = match?.[2];
      if (isLocale(cookieLocale)) {
        setCurrentLocale(cookieLocale);
      }
    }
    syncFromCookie();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    if (!isLocale(nextLocale)) {
      return;
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    setCurrentLocale(nextLocale);
    window.location.reload();
  };

  const names = variant === "header" ? languageNames : languageNamesFull;

  if (variant === "header") {
    return (
      <div className={cn("site-header__locale min-w-0 shrink", className)}>
        <label htmlFor={selectId} className="sr-only">
          {t("label")}
        </label>
        <select
          id={selectId}
          value={currentLocale}
          onChange={handleChange}
          aria-label={t("label")}
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
