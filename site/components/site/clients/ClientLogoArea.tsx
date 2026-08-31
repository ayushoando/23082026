"use client";
import { useState } from "react";

export function getInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface ClientLogoAreaProps {
  displayName: string;
  logoPath?: string;
}

export function ClientLogoArea({ displayName, logoPath }: ClientLogoAreaProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const showLogo = logoPath !== undefined && !imgFailed;

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden">
      {showLogo ? (
        <img
          src={logoPath}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-contain p-3"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--surface-muted)]"
          aria-hidden="true"
        >
          <span className="text-xl font-semibold tracking-wide text-[var(--text-muted)] select-none">
            {getInitials(displayName)}
          </span>
        </div>
      )}
    </div>
  );
}
