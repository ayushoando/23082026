import Link from "next/link";

import Planner from "@planner/components/Planner";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

export type PlannerAccessMode = "authenticated" | "guest";

export interface PlannerEntryProps {
  accessMode: PlannerAccessMode;
}

export function PlannerEntry({ accessMode }: PlannerEntryProps) {
  const isGuest = accessMode === "guest";

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-planner-access={accessMode}>
      <section
        className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 py-2 text-xs text-[var(--text-muted)] sm:px-6"
        aria-label="Planner access status"
        role="status"
      >
        <p className="m-0">
          <strong className="font-semibold text-[var(--text-strong)]">
            {isGuest ? "Guest workspace" : "Signed-in workspace"}
          </strong>{" "}
          <span>
            {isGuest
              ? "Browse the catalog and prepare a layout. Sign in when you want to save or open plans."
              : "Your saved plans are available from the project list."}
          </span>
        </p>
        <Link
          className="btn btn--sm"
          href={isGuest ? buildAccessRedirect("/ooplanner") : "/ooplanner/projects"}
        >
          {isGuest ? "Sign in to save" : "View saved plans"}
        </Link>
      </section>
      <Planner accessMode={accessMode} />
    </div>
  );
}
