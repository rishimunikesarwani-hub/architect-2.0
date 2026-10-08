import { describe, expect, it } from 'vitest';
import { File as NodeFile } from 'node:buffer';
import { convexTest } from 'convex-test';
import { register } from '@convex-dev/better-auth/test';
import { api, components } from '../application/backend/_generated/api';
import schema from '../application/backend/schema';
import { createProject } from '../application/data';
import { importProjectFiles, IMPORT_LIMIT } from '../application/shared-logic/import-project';
import { parseCloudState } from '../application/shared-logic/parse-cloud-state';
import { fitProjectToBudget, workspaceStateJson, WORKSPACE_BUDGET_BYTES } from '../application/shared-logic/project-budget';
import type { Project } from '../application/types';

const modules = import.meta.glob('../application/backend/**/*.{ts,js}');
const bytes = (text: string) => new TextEncoder().encode(text).length;
type InputFile = Parameters<typeof importProjectFiles>[0][number];
const file = (content: string): InputFile => new NodeFile([content], 'index.html') as unknown as InputFile;
const checkpoint = (content: string, id = 'checkpoint') => ({ id, label: id, at: new Date().toISOString(), files: [{ path: 'index.html', content }] });
const payload = (project: Project) => ({ title: project.title, description: project.description, framework: project.framework, stateJson: workspaceStateJson(project) });

async function owner() {
  // Fixture accounts and sessions exist only in the in-memory test database.
  const t = convexTest(schema, modules);
  register(t);
  const now = Date.now();
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: { model: 'user', data: { name: 'Budget fixture', username: 'budget.fixture', email: 'budget@example.invalid', emailVerified: false, createdAt: now, updatedAt: now } },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: { model: 'session', data: { userId: user._id, expiresAt: now + 300_000, token: 'in-memory-budget-session', createdAt: now, updatedAt: now } },
  });
  return t.withIdentity({ subject: user._id, sessionId: session._id });
}

describe('workspace budget and source fidelity', () => {
  it('keeps a fitting project and history unchanged, counting the exact transmitted envelope', () => {
    const project = createProject('Preserve this source', 'Custom');
    const prepared = fitProjectToBudget(project);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) throw new Error(prepared.error);
    expect(prepared.project).toBe(project);
    expect(prepared.removedCheckpoints).toBe(0);
    expect(prepared.bytes).toBe(bytes(workspaceStateJson(project)));
  });

  it('retains the newest fitting history suffix without modifying source or the input history', () => {
    const project = createProject('History accounting', 'Custom', undefined, 'import', [{ path: 'index.html', content: 'x'.repeat(200_000) }]);
    project.state.versions = [checkpoint('x'.repeat(200_000), 'old'), checkpoint('x'.repeat(150_000), 'middle'), checkpoint('😀"\\\n'.repeat(8000), 'new')];
    const before = structuredClone(project);
    const prepared = fitProjectToBudget(project);
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) throw new Error(prepared.error);
    expect(prepared.removedCheckpoints).toBe(1);
    expect(prepared.project.state.versions.map((item) => item.id)).toEqual(['middle', 'new']);
    expect(prepared.bytes).toBe(bytes(workspaceStateJson(prepared.project)));
    expect(prepared.bytes).toBeLessThanOrEqual(WORKSPACE_BUDGET_BYTES);
    expect(prepared.project.state.files).toBe(project.state.files);
    expect(project).toEqual(before);
  });

  it('accepts exactly the workspace budget and rejects one byte more without changing the proposal', () => {
    const project = createProject('Exact boundary', 'Custom', undefined, 'import', [{ path: 'index.html', content: '' }]);
    project.state.versions = [];
    project.state.files[0].content = 'x'.repeat(WORKSPACE_BUDGET_BYTES - bytes(workspaceStateJson(project)));
    const exact = fitProjectToBudget(project);
    expect(exact.ok).toBe(true);
    expect(exact.bytes).toBe(WORKSPACE_BUDGET_BYTES);
    const tooLarge = { ...project, state: { ...project.state, files: [{ ...project.state.files[0], content: project.state.files[0].content + 'x' }] } };
    const before = structuredClone(tooLarge);
    expect(fitProjectToBudget(tooLarge).ok).toBe(false);
    expect(tooLarge).toEqual(before);
    expect(bytes(workspaceStateJson(project))).toBe(WORKSPACE_BUDGET_BYTES);
  });

  it('imports 300 KB, creates the app, edits it, and reloads exact source after dropping an unaffordable checkpoint', async () => {
    const client = await owner();
    const prefix = '<!doctype html>\n<h1>नमस्ते 😀</h1>\n';
    const originalSource = prefix + 'x'.repeat(IMPORT_LIMIT - bytes(prefix));
    const imported = await importProjectFiles([file(originalSource)]);
    expect(bytes(imported[0].content)).toBe(IMPORT_LIMIT);
    const original = createProject('Continue this import', 'Custom', 'Large imported app', 'import', imported);
    const prepared = fitProjectToBudget(original);
    if (!prepared.ok) throw new Error(prepared.error);
    expect(prepared.removedCheckpoints).toBe(1);
    expect(prepared.project.state.versions).toEqual([]);
    expect(original.state.versions).toHaveLength(1);
    const id = await client.mutation(api.projects.create, payload(prepared.project));
    const saved = await client.query(api.projects.get, { id });
    expect(parseCloudState(saved.stateJson).state?.files).toEqual(imported);
    expect(parseCloudState(saved.stateJson).state?.versions).toEqual([]);
    const editedSource = originalSource + '\n<!-- edited and saved -->';
    const edit = { ...prepared.project, state: { ...prepared.project.state, files: [{ path: 'index.html', content: editedSource }], versions: [checkpoint(originalSource)] } };
    const preparedEdit = fitProjectToBudget(edit);
    if (!preparedEdit.ok) throw new Error(preparedEdit.error);
    expect(preparedEdit.project.state.versions).toEqual([]);
    await client.mutation(api.projects.update, { id, expectedRevision: 0, stateJson: workspaceStateJson(preparedEdit.project) });
    const reloaded = await client.query(api.projects.get, { id });
    const decoded = parseCloudState(reloaded.stateJson);
    expect(reloaded.revision).toBe(1);
    expect(decoded.invalid).toBe(false);
    expect(decoded.state?.files).toEqual([{ path: 'index.html', content: editedSource }]);
    expect(decoded.state?.versions).toEqual([]);
    expect(original.state.files).toEqual(imported);
    expect(original.state.files[0].content).toBe(originalSource);
  }, 30_000);

  it('rejects escaping-heavy imported source explicitly and preserves the existing app on a rejected oversized mutation', async () => {
    const client = await owner();
    const saved = createProject('Keep the working app', 'Custom');
    const id = await client.mutation(api.projects.create, payload(saved));
    const catalog = await client.query(api.projects.list, {});
    const imported = await importProjectFiles([file('\\'.repeat(IMPORT_LIMIT))]);
    const proposal = createProject('Oversized encoded import', 'Custom', undefined, 'import', imported);
    const before = structuredClone(proposal);
    const prepared = fitProjectToBudget(proposal);
    expect(prepared.ok).toBe(false);
    if (prepared.ok) throw new Error('Expected an explicit size error');
    expect(prepared.error).toContain('workspace limit');
    expect(prepared.error).toContain('source and draft have not been changed');
    expect(proposal).toEqual(before);
    expect(proposal.state.files).toEqual(imported);
    // A client bypass must still fail atomically at the unchanged server limit.
    await expect(client.mutation(api.projects.update, { id, expectedRevision: 0, title: 'Must not replace title', stateJson: workspaceStateJson(proposal) })).rejects.toThrow('Workspace is too large');
    const reloaded = await client.query(api.projects.get, { id });
    expect(reloaded.title).toBe(saved.title);
    expect(reloaded.revision).toBe(0);
    expect(reloaded.stateJson).toBe(workspaceStateJson(saved));
    expect(await client.query(api.projects.list, {})).toEqual(catalog);
  }, 30_000);
});
