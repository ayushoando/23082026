"use client";

import { useState } from "react";

export interface ClientLogoAreaProps {
  displayName: string;
  logoPath?: string;
}

/**
 * Two-letter initials for the logo fallback.
 * Single word → first two characters; multi-word → first characters of the
 * first two words. Always uppercased.
 */
export function getInitials(displayName: string): string {
  const words = displayName
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Logo area for a client card: the approved logo when present, or the
 * initials fallback when there is no logo or the image fails to load.
 */
export function ClientLogoArea({
  displayName,
  logoPath,
}: ClientLogoAreaProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const showFallback = !logoPath || imgFailed;

  return (
    <div className="clients-showcase__logo">
      {showFallback ? (
        <div className="clients-showcase__logo-fallback" aria-hidden="true">
          <span className="clients-showcase__logo-initials">
            {getInitials(displayName)}
          </span>
        </div>
      ) : (
        <img
          src={logoPath}
          alt={`${displayName} logo`}
          loading="eager"
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
}
