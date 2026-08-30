import Link from "next/link";

import Planner from "@planner/components/Planner";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

export type PlannerAccessMode = "authenticated" | "guest";
export type PlannerProjectStartIntent = "new" | "resume";

export interface PlannerEntryProps {
  accessMode: PlannerAccessMode;
  projectStartIntent?: PlannerProjectStartIntent;
}

export function PlannerEntry({
  accessMode,
  projectStartIntent = "resume",
}: PlannerEntryProps) {
  const isGuest = accessMode === "guest";

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-planner-access={accessMode}>
      {isGuest ? (
        <section
          className="planner-access-status flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6"
          aria-label="Planner access status"
          role="status"
        >
          <p className="m-0">
            <strong className="planner-access-status__label font-semibold">
              Guest workspace
            </strong>{" "}
            <span>
              Browse the catalog and prepare a layout. Sign in when you want to save or open plans.
            </span>
          </p>
          <Link
            className="btn btn--sm"
            href={buildAccessRedirect("/ooplanner")}
          >
            Sign in to save
          </Link>
        </section>
      ) : null}
      <Planner accessMode={accessMode} projectStartIntent={projectStartIntent} />
    </div>
  );
}
