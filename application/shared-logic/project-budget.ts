import type { Project } from '../types';

// Leave headroom below the backend's 600 KB limit. Measure exactly the JSON
// envelope sent as stateJson, including escaped source and saved checkpoints.
export const WORKSPACE_BUDGET_BYTES = 550_000;
const bytes = (value: string) => new TextEncoder().encode(value).length;

export function workspaceStateJson(project: Pick<Project, 'source' | 'color' | 'state'>): string {
  return JSON.stringify({ source: project.source, color: project.color, state: project.state });
}

export type ProjectBudgetResult =
  | { ok: true; project: Project; removedCheckpoints: number; bytes: number }
  | { ok: false; error: string; bytes: number };

/** Keep current source intact; retain the newest history suffix that fits. */
export function fitProjectToBudget(project: Project): ProjectBudgetResult {
  const originalBytes = bytes(workspaceStateJson(project));
  if (originalBytes <= WORKSPACE_BUDGET_BYTES) {
    return { ok: true, project, removedCheckpoints: 0, bytes: originalBytes };
  }
  const withoutHistory = { ...project, state: { ...project.state, versions: [] } };
  const baseBytes = bytes(workspaceStateJson(withoutHistory));
  if (baseBytes > WORKSPACE_BUDGET_BYTES) {
    return { ok: false, bytes: baseBytes, error: 'This app exceeds the workspace limit even without history. Reduce source or saved context and try again. Your source and draft have not been changed.' };
  }
  // The empty array is already counted in baseBytes. Add each serialized item
  // and its comma exactly once, avoiding repeated serialization of large state.
  let retainedBytes = baseBytes;
  let start = project.state.versions.length;
  while (start > 0) {
    const addedBytes = bytes(JSON.stringify(project.state.versions[start - 1]))
      + (start < project.state.versions.length ? 1 : 0);
    if (retainedBytes + addedBytes > WORKSPACE_BUDGET_BYTES) break;
    retainedBytes += addedBytes;
    start -= 1;
  }
  const fitted = { ...project, state: { ...project.state, versions: project.state.versions.slice(start) } };
  return { ok: true, project: fitted, removedCheckpoints: start, bytes: retainedBytes };
}
