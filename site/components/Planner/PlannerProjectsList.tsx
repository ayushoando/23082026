"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { trackPlannerProjectStart } from "@/lib/analytics/conversionContract";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { OoButton } from "@planner/components/ui/PlannerOoButton";
import {
  classifyPlannerProjectsListFailure,
  type PlannerProjectsListFailure,
} from "@planner/components/plannerProjectsListState";
import {
  createPlannerIdempotencyKey,
  createProject,
  deleteProject,
  fileUrl,
  isAbortError,
  listProjects,
  PlannerApiError,
} from "@planner/lib/plannerApi";
import { buildStarterProjectPayload } from "@planner/lib/starterProjectTemplate";
import type { PlannerProject } from "@planner/lib/plannerTypes";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";

export function ProjectsList() {
  const router = useRouter();
  const showToast = usePlannerUIStore((state) => state.showToast);
  const [projects, setProjects] = useState<PlannerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<PlannerProjectsListFailure | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingSample, setCreatingSample] = useState(false);
  const mutationKeysRef = useRef(new Map<string, string>());

  useEffect(() => {
    const controller = new AbortController();
    let stale = false;

    async function loadProjects() {
      try {
        setLoading(true);
        setFailure(null);
        const items = await listProjects({ signal: controller.signal });
        if (stale) return;
        setProjects(items);
      } catch (error: unknown) {
        if (isAbortError(error) || stale) return;
        setFailure(classifyPlannerProjectsListFailure(error));
      } finally {
        if (!stale) setLoading(false);
      }
    }

    void loadProjects();

    return () => {
      stale = true;
      controller.abort();
    };
  }, [retryCount]);

  const handleRetry = useCallback(() => {
    setFailure(null);
    setLoading(true);
    setRetryCount((count) => count + 1);
  }, []);

  const mutationKey = useCallback((operation: string, projectId: string) => {
    const identity = `${operation}:${projectId}`;
    const existing = mutationKeysRef.current.get(identity);
    if (existing) return existing;
    const created = createPlannerIdempotencyKey(operation, projectId);
    mutationKeysRef.current.set(identity, created);
    return created;
  }, []);

  const clearMutationKey = useCallback((operation: string, projectId: string) => {
    mutationKeysRef.current.delete(`${operation}:${projectId}`);
  }, []);

  const mutationFailure = useCallback((error: unknown, action: string) => {
    if (!(error instanceof PlannerApiError)) {
      showToast(`${action} failed. Try again.`, "error");
      return;
    }
    if (error.isUnauthorized || error.recovery === "reauthenticate-preserve-unsaved") {
      showToast("Sign in again to continue.", "error");
      router.push(buildAccessRedirect("/ooplanner/projects"));
      return;
    }
    if (error.isConflict) {
      showToast("This plan changed elsewhere. Refresh the list before retrying.", "error");
      return;
    }
    if (error.isOffline) {
      showToast("You are offline. Reconnect and retry; no plan was removed.", "error");
      return;
    }
    showToast(`${action} failed. Try again.`, "error");
  }, [router, showToast]);

  const doDelete = async (project: PlannerProject) => {
    if (deletingId || !window.confirm(`Delete "${project.name}"?`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id, {
        expectedRevision: project.revision,
        idempotencyKey: mutationKey("delete", project.id),
      });
      clearMutationKey("delete", project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      showToast("Deleted", "ok");
    } catch (error: unknown) {
      mutationFailure(error, "Delete");
    } finally {
      setDeletingId(null);
    }
  };

  const startFromSample = async () => {
    if (creatingSample) return;
    const templateIdentity = "starter-template";
    setCreatingSample(true);
    try {
      const created = await createProject(buildStarterProjectPayload(), {
        expectedRevision: 0,
        idempotencyKey: mutationKey("create", templateIdentity),
      });
      clearMutationKey("create", templateIdentity);
      trackPlannerProjectStart(created.id, templateIdentity);
      showToast("Sample workspace created", "ok");
      router.push(`/ooplanner/projects/${created.id}`);
    } catch (error: unknown) {
      mutationFailure(error, "Sample creation");
    } finally {
      setCreatingSample(false);
    }
  };

  const summary = loading
    ? "Loading saved plans"
    : failure
      ? "Saved plans unavailable"
      : `${projects.length} saved`;

  let content: ReactNode;

  if (loading) {
    content = (
      <section
        className="planner-load-state"
        role="status"
        aria-busy="true"
        data-testid="projects-list-loading"
      >
        <h2 className="planner-load-state__heading">Loading saved plans…</h2>
        <p className="planner-load-state__message">
          Checking the plans available to your account.
        </p>
      </section>
    );
  } else if (failure) {
    const needsSignIn = failure.kind === "unauthenticated";
    content = (
      <section
        className="planner-load-state"
        role="alert"
        data-error-kind={failure.kind}
        data-testid="projects-list-error"
      >
        <h2 className="planner-load-state__heading">{failure.heading}</h2>
        <p className="planner-load-state__message">{failure.message}</p>
        <div className="planner-load-state__actions">
          {needsSignIn ? (
            <Link
              className="btn btn--primary"
              href={buildAccessRedirect("/ooplanner/projects")}
            >
              Sign in
            </Link>
          ) : null}
          {failure.retryable ? (
            <OoButton onPress={handleRetry}>Try again</OoButton>
          ) : null}
          <Link className="btn" href="/ooplanner">
            Open guest workspace
          </Link>
        </div>
      </section>
    );
  } else if (projects.length === 0) {
    content = (
      <section className="panel-empty-state" data-testid="projects-empty-state">
        <div className="panel-empty-state__icon" aria-hidden="true">
          <PhIcon name="group" size={24} />
        </div>
        <h2 className="panel-empty-state__title">No saved plans yet</h2>
        <p className="panel-empty-state__body">
          Start a new plan to draw your floor, place furniture, and review the BOQ.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            className="btn btn--primary"
            href="/ooplanner"
            data-testid="empty-state-new-plan"
          >
            <PhIcon name="plus" size={18} /> Create your first plan
          </Link>
          <OoButton
            variant="ghost"
            isDisabled={creatingSample}
            onPress={() => {
              void startFromSample();
            }}
            data-testid="empty-state-sample-workspace"
          >
            {creatingSample ? "Creating sample…" : "Start from a sample workspace"}
          </OoButton>
        </div>
      </section>
    );
  } else {
    content = (
      <div className="projects-grid">
        {projects.map((project) => (
          <article key={project.id} className="project-card" data-testid={`project-${project.id}`}>
            <Link
              href={`/ooplanner/projects/${project.id}`}
              className="block rounded-[inherit] text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2"
              aria-label={`Open plan ${project.name}`}
            >
              <div className="project-card__thumb">
                {project.thumbnail_url ? (
                  <img src={fileUrl(project.thumbnail_url) ?? ""} alt="" />
                ) : (
                  <PhIcon name="rect" size={48} />
                )}
              </div>
              <div className="project-card__name">{project.name}</div>
              <div className="project-card__meta">
                {project.objects_count} objects · {new Date(project.updated_at).toLocaleDateString()}
              </div>
            </Link>
            <div className="mt-2 flex justify-end">
              <OoButton
                variant={["ghost", "icon"]}
                isDisabled={deletingId === project.id}
                onPress={() => {
                  void doDelete(project);
                }}
                data-testid={`del-${project.id}`}
                aria-label={
                  deletingId === project.id
                    ? `Deleting plan ${project.name}`
                    : `Delete plan ${project.name}`
                }
              >
                <PhIcon name="trash" size={18} />
              </OoButton>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-[var(--surface-soft)]"
      data-testid="projects-page"
    >
      <header className="flex items-center justify-between gap-4 px-6 pb-1 pt-6">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-[var(--text-strong)]">
            Floor plans
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]" aria-live="polite">
            {summary}
          </p>
        </div>
        <Link className="btn btn--primary" href="/ooplanner" data-testid="btn-new-project">
          <PhIcon name="plus" size={18} /> New plan
        </Link>
      </header>
      {content}
    </div>
  );
}
