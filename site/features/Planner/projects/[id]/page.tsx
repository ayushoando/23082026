import Planner from "@planner/components/Planner";
import { PlannerProjectAccessState } from "@planner/components/PlannerProjectAccessState";
import { getOptionalPlannerUser } from "@/lib/auth/plannerSession";

export interface PlannerProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function PlannerProjectPage({ params }: PlannerProjectPageProps) {
  const [{ id }, user] = await Promise.all([params, getOptionalPlannerUser()]);

  if (!user) {
    return (
      <PlannerProjectAccessState
        context="project"
        returnPath={`/ooplanner/projects/${encodeURIComponent(id)}`}
      />
    );
  }

  return <Planner accessMode="authenticated" />;
}
