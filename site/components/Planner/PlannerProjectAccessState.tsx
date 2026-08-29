import Link from "next/link";

import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

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
    <section
      className="planner-load-state"
      aria-labelledby="planner-project-access-heading"
      data-testid="planner-project-access-state"
    >
      <h1
        className="planner-load-state__heading"
        id="planner-project-access-heading"
      >
        {isProject ? "Sign in to open this plan" : "Sign in to view saved plans"}
      </h1>
      <p className="planner-load-state__message">
        {isProject
          ? "Project records are private. Sign in to verify that this plan belongs to your account."
          : "Saved plans are private to their owner. You can still use the guest workspace and browse the catalog without signing in."}
      </p>
      <div className="planner-load-state__actions">
        <Link className="btn btn--primary" href={buildAccessRedirect(returnPath)}>
          Sign in
        </Link>
        <Link className="btn" href="/ooplanner">
          Continue in guest workspace
        </Link>
      </div>
    </section>
  );
}
