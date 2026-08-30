import { PlannerEntry, type PlannerProjectStartIntent } from "@planner/components/PlannerEntry";
import { getOptionalPlannerUser } from "@/lib/auth/plannerSession";

export interface PlannerPageProps {
  searchParams?: Promise<{ new?: string | string[] | undefined }>;
}

function projectStartIntent(
  searchParams: { new?: string | string[] | undefined },
): PlannerProjectStartIntent {
  return searchParams.new === "1" ? "new" : "resume";
}

export async function PlannerPage({
  searchParams = Promise.resolve({}),
}: PlannerPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    getOptionalPlannerUser(),
    searchParams,
  ]);

  return (
    <PlannerEntry
      accessMode={user ? "authenticated" : "guest"}
      projectStartIntent={projectStartIntent(resolvedSearchParams)}
    />
  );
}
