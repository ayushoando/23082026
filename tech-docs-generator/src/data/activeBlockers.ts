/**
 * Mirror of repo-root Failures.md active table.
 * Update here when Failures.md changes (tech-docs has no live file read at runtime).
 */
export type ActiveBlocker = {
  id: string
  blocker: string
  evidence: string
  action: string
}

export const activeBlockers: ActiveBlocker[] = []
