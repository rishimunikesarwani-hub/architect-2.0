import { describe, expect, it, vi } from 'vitest';
import { File as NodeFile } from 'node:buffer';
import { convexTest } from 'convex-test';
import { register } from '@convex-dev/better-auth/test';
import { api, components } from '../application/backend/_generated/api';
import schema from '../application/backend/schema';
import { createProject } from '../application/data';
import { importProjectFiles } from '../application/shared-logic/import-project';
import { parseCloudState } from '../application/shared-logic/parse-cloud-state';
import { ProjectSaveQueue } from '../application/shared-logic/project-save-queue';

// The comparison runner copies this file into each snapshot's test directory
// and rewrites only the historical source paths. Never use ConvexHttpClient or
// the deployed smoke script here: every account and request stays in convex-test.
const modules = import.meta.glob('../application/backend/**/*.{ts,js}');
const bytes = (value: string) => new TextEncoder().encode(value).length;
type InputFile = Parameters<typeof importProjectFiles>[0][number];
const sourceFile = (name: string, content: string): InputFile =>
  new NodeFile([content], name) as unknown as InputFile;

function setup() {
  const t = convexTest(schema, modules);
  register(t);
  return t;
}

async function account(t: ReturnType<typeof setup>, loginId: string) {
  const now = Date.now();
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: { model: 'user', data: {
      name: loginId, username: loginId, email: `${loginId}@example.invalid`,
      emailVerified: false, createdAt: now, updatedAt: now,
    } },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: { model: 'session', data: {
      userId: user._id, expiresAt: now + 300_000,
      token: `in-memory-evaluation-${loginId}`, createdAt: now, updatedAt: now,
    } },
  });
  return { id: user._id as string, client: t.withIdentity({ subject: user._id, sessionId: session._id }) };
}

function payload(project: ReturnType<typeof createProject>) {
  return {
    title: project.title, description: project.description, framework: project.framework,
    stateJson: JSON.stringify({ source: project.source, color: project.color, state: project.state }),
  };
}

async function sharedApp() {
  const t = setup();
  const owner = await account(t, 'evaluation.owner');
  const editor = await account(t, 'evaluation.editor');
  const workspaceId = await owner.client.mutation(api.teams.createWorkspace, { name: 'In-memory evaluation' });
  const departmentId = await owner.client.mutation(api.teams.createDepartment, { workspaceId, name: 'Support' });
  await owner.client.mutation(api.teams.setMember, { workspaceId, departmentId, loginId: 'evaluation.editor' });
  const project = createProject('Review requests', 'Custom', 'Evaluation app');
  const initial = payload(project);
  const id = await owner.client.mutation(api.projects.create, { ...initial, workspaceId });
  await owner.client.mutation(api.teams.setProjectGrant, { projectId: id, departmentId, role: 'editor' });
  return { t, owner, editor, departmentId, id, project, initial };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}

function errorData(error: unknown): unknown {
  const data = (error as { data?: unknown })?.data;
  if (typeof data !== 'string') return data;
  try { return JSON.parse(data); } catch { return data; }
}

describe('finite backend and source-fidelity evaluation', () => {
  it('preserves a 220 KB multilingual import and its checkpoint through a real in-memory save/read/parser round trip', async () => {
    const t = setup();
    const owner = await account(t, 'evaluation.import');
    const prefix = '<!doctype html>\r\n<h1>नमस्ते 😀 e\u0301</h1>\r\n<script>const literal = "<tag> & \\\\";</script>\r\n';
    const html = prefix + 'x'.repeat(220_000 - bytes(prefix));
    expect(bytes(html)).toBe(220_000);
    const imported = await importProjectFiles([sourceFile('index.html', html)]);
    expect(imported).toEqual([{ path: 'index.html', content: html }]);
    const project = createProject('Keep the supplied source', 'Custom', 'Imported evaluation', 'import', imported);
    const serialized = payload(project);
    // This positive control must fit the actual frontend creation budget.
    expect(bytes(serialized.stateJson)).toBeLessThanOrEqual(550_000);
    expect(project.state.files).toEqual(imported);
    expect(project.state.versions[0].files).toEqual(imported);
    expect(project.state.versions[0].files).not.toBe(project.state.files);
    const id = await owner.client.mutation(api.projects.create, serialized);
    const saved = await owner.client.query(api.projects.get, { id });
    expect(saved.stateJson).toBe(serialized.stateJson);
    const decoded = parseCloudState(saved.stateJson);
    expect(decoded.invalid).toBe(false);
    expect(decoded.source).toBe('import');
    expect(decoded.state?.files).toEqual(imported);
    expect(decoded.state?.versions[0].files).toEqual(imported);
    const cards = await owner.client.query(api.projects.list, {});
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ _id: id, source: 'import', revision: 0, versionCount: 1, stateLoaded: false });
    expect(cards[0]).not.toHaveProperty('stateJson');
  }, 30_000);

  it('records the quality boundary: an accepted 300 KB import plus its initial backup exceeds the save budget and creates no partial app', async () => {
    const t = setup();
    const owner = await account(t, 'evaluation.capacity');
    const html = 'x'.repeat(300_000);
    const imported = await importProjectFiles([sourceFile('index.html', html)]);
    expect(imported[0].content).toBe(html);
    const project = createProject('Keep the supplied source', 'Custom', 'Capacity evaluation', 'import', imported);
    const serialized = payload(project);
    // Passing this scenario records the limitation. It does not score the
    // 300 KB import as a successful end-to-end app creation or exercise the UI.
    expect(bytes(serialized.stateJson)).toBeGreaterThan(550_000);
    expect(bytes(serialized.stateJson)).toBeGreaterThan(600_000);
    await expect(owner.client.mutation(api.projects.create, serialized)).rejects.toThrow('600 KB');
    expect(await owner.client.query(api.projects.list, {})).toEqual([]);
    const stored = await t.run(async (ctx) => ({
      projects: await ctx.db.query('projects').collect(),
      cards: await ctx.db.query('projectCatalog').collect(),
    }));
    expect(stored).toEqual({ projects: [], cards: [] });
    expect(imported[0].content).toBe(html);
  }, 30_000);

  it('denies a late commit after grant revocation, discards queued writes, and requires conflict recovery after access returns', async () => {
    const { owner, editor, departmentId, id, project, initial } = await sharedApp();
    const gate = deferred<void>();
    const failures = [deferred<void>(), deferred<void>()];
    let failureCount = 0;
    const first = { id, revision: 0, title: 'First unsaved edit', stateJson: initial.stateJson };
    const envelopeWithHtml = (content: string) => JSON.stringify({
      source: project.source, color: project.color,
      state: { ...project.state, files: [{ path: 'index.html', content }] },
    });
    const second = { ...first, title: 'Latest unsaved edit', stateJson: envelopeWithHtml('<h1>Latest unsaved source</h1>') };
    const newerStateJson = envelopeWithHtml('<h1>Owner newer source</h1>');
    const write = vi.fn(async (draft: typeof first, expectedRevision: number) => {
      await gate.promise;
      return editor.client.mutation(api.projects.update, {
        id: draft.id, expectedRevision, title: draft.title, stateJson: draft.stateJson,
      });
    });
    const onSaved = vi.fn();
    const onFailure = vi.fn((_draft: typeof first, _error: unknown) => { failures[failureCount++]?.resolve(undefined); });
    const onPending = vi.fn();
    const queue = new ProjectSaveQueue<typeof first>({ write, onSaved, onFailure, onPending });
    queue.enqueue(first);
    queue.enqueue(second);
    expect(write).toHaveBeenCalledTimes(1);
    await owner.client.mutation(api.projects.update, { id, expectedRevision: 0, title: 'Owner saved newer source', stateJson: newerStateJson });
    await owner.client.mutation(api.teams.revokeProjectGrant, { projectId: id, departmentId });
    gate.resolve(undefined);
    await failures[0].promise;
    expect(onSaved).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledTimes(1);
    expect(queue.isDirty(id)).toBe(true);
    expect(queue.isBlocked(id)).toBe(true);
    expect(onPending).toHaveBeenLastCalledWith(0);
    expect(String(onFailure.mock.calls[0][1])).toContain('Project not found');
    expect(JSON.stringify(errorData(onFailure.mock.calls[0][1]) ?? null)).not.toContain('REVISION_CONFLICT');
    expect(await editor.client.query(api.projects.watch, { id })).toBeNull();
    expect(await editor.client.query(api.projects.list, {})).toEqual([]);
    const preserved = await owner.client.query(api.projects.get, { id });
    expect(preserved).toMatchObject({ title: 'Owner saved newer source', revision: 1, stateJson: newerStateJson });

    await owner.client.mutation(api.teams.setProjectGrant, { projectId: id, departmentId, role: 'editor' });
    expect(write).toHaveBeenCalledTimes(1);
    queue.retry(second);
    await failures[1].promise;
    expect(write.mock.calls.map(([, revision]) => revision)).toEqual([0, 0]);
    expect(errorData(onFailure.mock.calls[1][1])).toMatchObject({ code: 'REVISION_CONFLICT', currentRevision: 1 });
    expect(queue.hasPendingChanges()).toBe(true);
    expect(queue.isBlocked(id)).toBe(true);
    expect(onSaved).not.toHaveBeenCalled();
    expect(await owner.client.query(api.projects.get, { id })).toEqual(preserved);
  }, 30_000);

  it('rejects invalid full-state updates atomically without consuming a revision or changing catalog metadata', async () => {
    const t = setup();
    const owner = await account(t, 'evaluation.atomic');
    const initial = payload(createProject('Review requests', 'Custom', 'Atomic evaluation'));
    const id = await owner.client.mutation(api.projects.create, initial);
    const before = await owner.client.query(api.projects.get, { id });
    const cardsBefore = await owner.client.query(api.projects.list, {});
    for (const [stateJson, message] of [
      ['{broken', 'valid JSON'],
      [JSON.stringify({ content: 'x'.repeat(600_000) }), '600 KB'],
    ]) {
      await expect(owner.client.mutation(api.projects.update, {
        id, expectedRevision: 0, title: 'Must not persist', description: 'Must not replace the card',
        stage: 'deployed', framework: 'LangGraph', stateJson,
      })).rejects.toThrow(message);
      expect(await owner.client.query(api.projects.get, { id })).toEqual(before);
      expect(await owner.client.query(api.projects.list, {})).toEqual(cardsBefore);
    }
    expect(await owner.client.mutation(api.projects.update, {
      id, expectedRevision: 0, title: 'Valid next edit', stateJson: initial.stateJson,
    })).toEqual({ id, revision: 1 });
    expect((await owner.client.query(api.projects.list, {}))[0]).toMatchObject({ title: 'Valid next edit', revision: 1 });
  }, 30_000);

  it('preserves malformed collaborator JSON for recovery while rejecting it as renderable state, then restores valid source at the next revision', async () => {
    const { owner, editor, id, project, initial } = await sharedApp();
    const hostile = JSON.stringify({
      source: 'import', color: 'mint', effectiveRole: 'owner',
      state: { ...project.state, agents: [{ ...project.state.agents[0], instructions: null }] },
    });
    // The server validates the envelope and access, while the client parser
    // guards its richer render shape. This is not a browser recovery-button test.
    expect(await editor.client.mutation(api.projects.update, { id, expectedRevision: 0, stateJson: hostile }))
      .toEqual({ id, revision: 1 });
    const stored = await owner.client.query(api.projects.watch, { id });
    expect(stored?.stateJson).toBe(hostile);
    expect(parseCloudState(stored!.stateJson)).toMatchObject({ state: null, invalid: true });
    expect((await editor.client.query(api.projects.get, { id })).effectiveRole).toBe('editor');
    expect((await owner.client.query(api.projects.list, {}))[0]).not.toHaveProperty('stateJson');
    expect(await owner.client.mutation(api.projects.update, { id, expectedRevision: 1, stateJson: initial.stateJson }))
      .toEqual({ id, revision: 2 });
    const restored = await editor.client.query(api.projects.get, { id });
    expect(restored.stateJson).toBe(initial.stateJson);
    expect(parseCloudState(restored.stateJson)).toMatchObject({ invalid: false, state: project.state });
  }, 30_000);
});
