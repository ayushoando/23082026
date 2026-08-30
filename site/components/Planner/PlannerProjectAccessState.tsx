import Link from "next/link";

import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { PlannerStateSurface } from "@planner/components/ui/PlannerStateSurface";

export interface PlannerProjectAccessStateProps {
  context: "project" | "project-list";
  returnPath: string;
}

export function PlannerProjectAccessState({
  context,
  returnPath,
}: PlannerProjectAccessStateProps) {
  const isProject = context === "project";

  return (
    <PlannerStateSurface
      kind="unauthenticated"
      heading={isProject ? "Sign in to open this plan" : "Sign in to view saved plans"}
      message={
        isProject
          ? "Project records are private. Sign in to verify that this plan belongs to your account."
          : "Saved plans are private to their owner. You can still use the guest workspace and browse the catalog without signing in."
      }
      className="planner-load-state"
      headingClassName="planner-load-state__heading"
      messageClassName="planner-load-state__message"
      actionsClassName="planner-load-state__actions"
      headingId="planner-project-access-heading"
      headingLevel={1}
      role="region"
      live="off"
      testId="planner-project-access-state"
      actions={
        <>
          <Link className="btn btn--primary" href={buildAccessRedirect(returnPath)}>
            Sign in
          </Link>
          <Link className="btn" href="/ooplanner">
            Continue in guest workspace
          </Link>
        </>
      }
    />
  );
}
