"use client";

import { Robot as Bot } from "@phosphor-icons/react";

export function OpenAssistantButton({
  label,
  className,
  mode = "guided",
}: {
  label: string;
  className?: string;
  mode?: "guided" | "ai";
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(
        new CustomEvent("oando-assistant:open", { detail: { tab: mode } }),
      )}
      className={className}
    >
      <Bot className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
