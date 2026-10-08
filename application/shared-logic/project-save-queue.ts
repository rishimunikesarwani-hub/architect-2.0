export type ProjectSaveResult = { id: string; revision: number };

type ProjectSaveQueueOptions<T> = {
  write: (project: T, expectedRevision: number) => Promise<ProjectSaveResult>;
  onSaved: (project: T, result: ProjectSaveResult) => void;
  onFailure: (project: T, error: unknown) => void;
  onPending: (count: number) => void;
};

type Save<T> = { project: T; version: number };
type ProjectQueue<T> = {
  revision: number;
  version: number;
  dirty: boolean;
  blocked: boolean;
  queued: Save<T>[];
  running?: Save<T>;
};

/** Serializes each project's immutable draft snapshots; other projects can save independently. */
export class ProjectSaveQueue<T extends { id: string; revision?: number }> {
  private readonly projects = new Map<string, ProjectQueue<T>>();
  private pending = 0;

  constructor(private readonly options: ProjectSaveQueueOptions<T>) {}

  /** Subscription updates must never move a dirty draft's conflict baseline. */
  observe(project: T): void {
    const state = this.stateFor(project);
    if (!state.dirty && !state.blocked) {
      state.revision = Math.max(state.revision, project.revision ?? 0);
    }
  }

  enqueue(project: T): void {
    const state = this.stateFor(project);
    // A subscription may arrive before the UI applies its contents. The first
    // edit must compare against the draft's revision, not newer unseen content.
    // Once dirty, successful writes supply the baseline for queued local edits.
    if (!state.dirty && !state.blocked && project.revision !== undefined) {
      state.revision = project.revision;
    }
    state.dirty = true;
    const version = ++state.version;
    // A failure discards scheduled snapshots; retry must supply the current draft.
    if (state.blocked) return;
    state.queued.push({ project, version });
    this.pending++;
    this.options.onPending(this.pending);
    this.start(project.id, state);
  }

  hasPendingChanges(): boolean {
    return [...this.projects.values()].some((state) => state.dirty);
  }

  isDirty(id: string): boolean {
    return this.projects.get(id)?.dirty ?? false;
  }

  isBlocked(id: string): boolean {
    return this.projects.get(id)?.blocked ?? false;
  }

  /** Retains the previous server baseline; conflicts cannot silently become overwrites. */
  retry(project: T): void {
    const state = this.stateFor(project);
    state.blocked = false;
    this.enqueue(project);
  }

  /** Restores an unsaved draft without writing; explicit retry preserves its revision. */
  hold(project: T): void {
    const old = this.projects.get(project.id);
    if (old) this.pending -= old.queued.length + (old.running ? 1 : 0);
    this.projects.set(project.id, {
      revision: project.revision ?? old?.revision ?? 0,
      version: 1,
      dirty: true,
      blocked: true,
      queued: [],
    });
    this.options.onPending(this.pending);
  }

  /** Call after preserving/discarding the local draft; invalidates this project's old callbacks. */
  acceptRemote(project: T): void {
    const old = this.projects.get(project.id);
    if (old) this.pending -= old.queued.length + (old.running ? 1 : 0);
    this.projects.delete(project.id);
    this.stateFor(project);
    this.options.onPending(this.pending);
  }

  /** In-flight network requests cannot be cancelled, but cannot mutate the new session's state. */
  reset(): void {
    this.projects.clear();
    this.pending = 0;
    this.options.onPending(0);
  }

  private stateFor(project: T): ProjectQueue<T> {
    let state = this.projects.get(project.id);
    if (!state) {
      state = { revision: project.revision ?? 0, version: 0, dirty: false, blocked: false, queued: [] };
      this.projects.set(project.id, state);
    }
    return state;
  }

  private start(id: string, state: ProjectQueue<T>): void {
    if (this.projects.get(id) !== state || state.running || state.blocked) return;
    const next = state.queued.shift();
    if (!next) return;
    state.running = next;
    void this.write(id, state, next);
  }

  private async write(id: string, state: ProjectQueue<T>, save: Save<T>): Promise<void> {
    let result: ProjectSaveResult;
    try {
      result = await this.options.write(save.project, state.revision);
    } catch (error) {
      if (this.projects.get(id) !== state) return;
      state.blocked = true;
      state.dirty = true;
      this.pending -= state.queued.length + 1;
      state.queued = [];
      state.running = undefined;
      try {
        this.options.onFailure(save.project, error);
      } finally {
        this.options.onPending(this.pending);
      }
      return;
    }

    if (this.projects.get(id) !== state) return;
    state.revision = result.revision;
    state.dirty = state.version !== save.version;
    state.running = undefined;
    this.pending--;
    try {
      this.options.onSaved(save.project, result);
    } finally {
      this.options.onPending(this.pending);
      this.start(id, state);
    }
  }
}
