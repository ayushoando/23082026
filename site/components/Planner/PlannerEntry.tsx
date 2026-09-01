import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Planner from "@planner/components/Planner";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

export type PlannerAccessMode = "authenticated" | "guest";
export type PlannerProjectStartIntent = "new" | "resume";

export interface PlannerEntryProps {
  accessMode: PlannerAccessMode;
  projectStartIntent?: PlannerProjectStartIntent;
}

export async function PlannerEntry({
  accessMode,
  projectStartIntent = "resume",
}: PlannerEntryProps) {
  // Workspace chrome strings live in the shared `workspace` namespace so hi
  // users do not get English-only planner entry chrome.
  const t = await getTranslations("workspace");
  const isGuest = accessMode === "guest";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-planner-access={accessMode}
    >
      <section
        className="planner-access-status flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6"
        aria-label={t("plannerEntry.accessStatusLabel")}
        role="status"
      >
        <p className="m-0">
          <strong className="planner-access-status__label font-semibold">
            {isGuest
              ? t("plannerEntry.guestLabel")
              : t("plannerEntry.signedInLabel")}
          </strong>{" "}
          <span>
            {isGuest
              ? t("plannerEntry.guestHint")
              : t("plannerEntry.signedInHint")}
          </span>
        </p>
        <Link
          className="btn btn--sm"
          href={
            isGuest ? buildAccessRedirect("/ooplanner") : "/ooplanner/projects"
          }
        >
          {isGuest ? t("plannerEntry.signInToSave") : t("plannerEntry.viewSavedPlans")}
        </Link>
      </section>
      <Planner
        accessMode={accessMode}
        projectStartIntent={projectStartIntent}
      />
    </div>
  );
}
