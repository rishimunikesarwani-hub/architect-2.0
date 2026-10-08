import { describe, expect, it } from 'vitest';
import type { Project } from '../application/types';
import { reconcileProjectCards } from '../application/shared-logic/project-sync';

function fullProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'shared-app', title: 'Invoice review', description: 'Complete project instructions beyond the card excerpt.',
    framework: 'LangGraph', updatedAt: 100, stage: 'ready', source: 'prompt', color: 'mint',
    ownerId: 'owner-a', revision: 3, stateLoaded: true,
    access: { role: 'editor', departmentName: 'Support', workspaceId: 'company' },
    state: { messages: [], files: [{ path: 'index.html', content: '<h1>Working source</h1>' }], agents: [], connections: [], versions: [], theme: 'Sage' },
    ...overrides,
  };
}

function card(overrides: Partial<Project> = {}): Project {
  return fullProject({
    description: 'Abbreviated card excerpt', stateLoaded: false, savedVersionCount: 2,
    state: { messages: [], files: [], agents: [], connections: [], versions: [], theme: 'Sage' },
    ...overrides,
  });
}

const noDrafts = () => new Map<string, Project>();
const clean = () => false;

describe('authorized project-card reconciliation', () => {
  it('keeps full source and description when same-revision metadata refreshes', () => {
    const loaded = fullProject();
    const metadata = card();
    const [result] = reconcileProjectCards([loaded], [metadata], noDrafts(), clean);
    expect(result.state).toBe(loaded.state);
    expect(result.description).toBe(loaded.description);
    expect(result.stateLoaded).toBe(true);
    expect(result.revision).toBe(3);
    expect(metadata.state.files).toEqual([]);
    expect(loaded.access?.role).toBe('editor');
  });

  it('invalidates old full source when a clean project receives a newer metadata revision', () => {
    const loaded = fullProject();
    const metadata = card({ revision: 4, title: 'Remote renamed app', updatedAt: 200 });
    const [result] = reconcileProjectCards([loaded], [metadata], noDrafts(), clean);
    expect(result).toBe(metadata);
    expect(result.revision).toBe(4);
    expect(result.title).toBe('Remote renamed app');
    expect(result.stateLoaded).toBe(false);
    expect(result.state.files).toEqual([]);
    expect(loaded.state.files[0].content).toBe('<h1>Working source</h1>');
  });

  it('retains the newest dirty draft but applies a department downgrade and owner change', () => {
    const loaded = fullProject();
    const draft = fullProject({ title: 'Unsaved local name', description: 'Unsaved complete instructions',
      state: { ...loaded.state, files: [{ path: 'index.html', content: '<h1>Local unsaved work</h1>' }] } });
    const permission: Project['access'] = { role: 'viewer', departmentName: 'Finance', workspaceId: 'company' };
    const metadata = card({ revision: 8, ownerId: 'owner-b', access: permission });
    const drafts = new Map([[draft.id, draft]]);
    const [result] = reconcileProjectCards([loaded], [metadata], drafts, (id) => id === draft.id);
    expect(result.state).toBe(draft.state);
    expect(result.title).toBe('Unsaved local name');
    expect(result.description).toBe('Unsaved complete instructions');
    expect(result.revision).toBe(3);
    expect(result.stateLoaded).toBe(true);
    expect(result.access).toEqual(permission);
    expect(result.ownerId).toBe('owner-b');
    expect(draft.access?.role).toBe('editor');
    expect(draft.ownerId).toBe('owner-a');
    expect(drafts.get(draft.id)).toBe(draft);
  });

  it('removes IDs missing from the authorized list while retaining recovery drafts separately', () => {
    const revoked = fullProject();
    const allowed = fullProject({ id: 'allowed-app' });
    const drafts = new Map([[revoked.id, revoked]]);
    const result = reconcileProjectCards([revoked, allowed], [card({ id: allowed.id })], drafts, () => true);
    expect(result.map((entry) => entry.id)).toEqual(['allowed-app']);
    expect(drafts.get(revoked.id)).toBe(revoked);
  });

  it('does not regress source, content or revision for an older card snapshot', () => {
    const loaded = fullProject({ revision: 9, title: 'Latest local title', updatedAt: 900 });
    const metadata = card({ revision: 7, title: 'Old title', updatedAt: 700, access: { role: 'viewer' } });
    const [result] = reconcileProjectCards([loaded], [metadata], noDrafts(), clean);
    expect(result.state).toBe(loaded.state);
    expect(result.description).toBe(loaded.description);
    expect(result.title).toBe('Latest local title');
    expect(result.updatedAt).toBe(900);
    expect(result.revision).toBe(9);
    expect(result.access?.role).toBe('viewer');
  });

  it('restores a held draft for an authorized card without requiring it in the current list', () => {
    const restored = fullProject({ revision: 1, title: 'Draft kept during sign-out' });
    const metadata = card({ revision: 5 });
    const [result] = reconcileProjectCards([], [metadata], new Map([[restored.id, restored]]), () => true);
    expect(result.state).toBe(restored.state);
    expect(result.title).toBe(restored.title);
    expect(result.revision).toBe(1);
    expect(result.access).toEqual(metadata.access);
  });

  it('keeps metadata ordering and admits new cards without manufacturing source state', () => {
    const existing = fullProject();
    const newCard = card({ id: 'new-app', revision: undefined, stateLoaded: undefined });
    const result = reconcileProjectCards([existing], [newCard, card()], noDrafts(), clean);
    expect(result.map((entry) => entry.id)).toEqual(['new-app', existing.id]);
    expect(result[0]).toBe(newCard);
    expect(result[0].stateLoaded).toBeUndefined();
    expect(result[0].state.files).toEqual([]);
    expect(result[1].state).toBe(existing.state);
  });
});
