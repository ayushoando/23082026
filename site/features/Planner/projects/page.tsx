import { PlannerProjectAccessState } from "@planner/components/PlannerProjectAccessState";
import { ProjectsList } from "@planner/components/PlannerProjectsList";
import { getOptionalPlannerUser } from "@/lib/auth/plannerSession";

export async function PlannerProjectsPage() {
  const user = await getOptionalPlannerUser();

  if (!user) {
    return (
      <PlannerProjectAccessState
        context="project-list"
        returnPath="/ooplanner/projects"
      />
    );
  }

  return <ProjectsList />;
}
