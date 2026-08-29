import { PlannerEntry } from "@planner/components/PlannerEntry";
import { getOptionalPlannerUser } from "@/lib/auth/plannerSession";

export async function PlannerPage() {
  const user = await getOptionalPlannerUser();

  return <PlannerEntry accessMode={user ? "authenticated" : "guest"} />;
}
