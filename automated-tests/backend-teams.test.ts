import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import { register } from '@convex-dev/better-auth/test';
import { api, components, internal } from '../application/backend/_generated/api';
import schema from '../application/backend/schema';

const modules = import.meta.glob('../application/backend/**/*.{ts,js}');
function setup() { const t = convexTest(schema, modules); register(t); return t; }
async function account(t: ReturnType<typeof setup>, loginId: string, expiresIn = 300_000) {
  const now = Date.now();
  const user = await t.mutation(components.betterAuth.adapter.create, { input: { model: 'user', data: { name: loginId, username: loginId, email: `${loginId}@example.invalid`, emailVerified: false, createdAt: now, updatedAt: now } } });
  const session = await t.mutation(components.betterAuth.adapter.create, { input: { model: 'session', data: { userId: user._id, expiresAt: now + expiresIn, token: `test-session-${loginId}`, createdAt: now, updatedAt: now } } });
  return { id: user._id as string, client: t.withIdentity({ subject: user._id, sessionId: session._id }) };
}
const sample = { title: 'Shared operations app', description: 'One app for multiple departments', framework: 'LangGraph' as const, stateJson: JSON.stringify({ state: { files: [{ path: 'index.html', content: '<h1>Shared source</h1>' }] } }) };
async function team() {
  const t = setup(); const owner = await account(t, 'owner'); const sales = await account(t, 'sales'); const finance = await account(t, 'finance'); const outsider = await account(t, 'outsider');
  const workspaceId = await owner.client.mutation(api.teams.createWorkspace, { name: 'Company workspace' });
  const salesDepartment = await owner.client.mutation(api.teams.createDepartment, { workspaceId, name: 'Sales' });
  const financeDepartment = await owner.client.mutation(api.teams.createDepartment, { workspaceId, name: 'Finance' });
  await owner.client.mutation(api.teams.setMember, { workspaceId, loginId: '  SALES ', departmentId: salesDepartment });
  await owner.client.mutation(api.teams.setMember, { workspaceId, loginId: 'finance', departmentId: financeDepartment });
  const projectId = await owner.client.mutation(api.projects.create, { ...sample, workspaceId });
  await owner.client.mutation(api.teams.setProjectGrant, { projectId, departmentId: salesDepartment, role: 'editor' });
  await owner.client.mutation(api.teams.setProjectGrant, { projectId, departmentId: financeDepartment, role: 'viewer' });
  return { t, owner, sales, finance, outsider, workspaceId, salesDepartment, financeDepartment, projectId };
}

describe('department membership and same-app access', () => {
  it('exposes the same ID/source to authorized department logins and saves one shared version', async () => {
    const { owner, sales, finance, projectId } = await team();
    const salesProject = await sales.client.query(api.projects.get, { id: projectId });
    const financeProject = await finance.client.query(api.projects.get, { id: projectId });
    expect(salesProject._id).toBe(financeProject._id);
    expect(salesProject.stateJson).toBe(financeProject.stateJson);
    expect(salesProject).toMatchObject({ effectiveRole: 'editor', departmentName: 'Sales', workspaceName: 'Company workspace', revision: 0 });
    expect(financeProject).toMatchObject({ effectiveRole: 'viewer', departmentName: 'Finance' });
    expect(await sales.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, title: 'Shared new title' })).toEqual({ id: projectId, revision: 1 });
    expect((await finance.client.query(api.projects.list, {}))[0]).toMatchObject({ _id: projectId, title: 'Shared new title', revision: 1 });
    expect((await owner.client.query(api.projects.get, { id: projectId })).title).toBe('Shared new title');
  }, 20_000);

  it('blocks viewer writes and member privilege escalation at server boundaries', async () => {
    const { sales, finance, projectId, workspaceId, salesDepartment } = await team();
    await expect(finance.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, stateJson: '{}' })).rejects.toThrow('read-only');
    await expect(finance.client.mutation(api.projects.archive, { id: projectId })).rejects.toThrow('administrator');
    await expect(sales.client.mutation(api.projects.archive, { id: projectId })).rejects.toThrow('administrator');
    await expect(finance.client.mutation(api.teams.setProjectGrant, { projectId, departmentId: salesDepartment, role: 'editor' })).rejects.toThrow('administrator');
    await expect(finance.client.mutation(api.teams.setMember, { workspaceId, loginId: 'finance', departmentId: salesDepartment })).rejects.toThrow('administrator');
    await expect(sales.client.mutation(api.projects.create, { ...sample, workspaceId })).rejects.toThrow('administrator');
    await expect(sales.client.query(api.teams.details, { workspaceId })).rejects.toThrow('administrator');
  });

  it('does not expose a shared project or team roster to another account', async () => {
    const { outsider, projectId, workspaceId } = await team();
    expect(await outsider.client.query(api.projects.list, {})).toEqual([]);
    expect(await outsider.client.query(api.teams.listWorkspaces, {})).toEqual([]);
    await expect(outsider.client.query(api.projects.get, { id: projectId })).rejects.toThrow('Project not found');
    await expect(outsider.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, title: 'Intrusion' })).rejects.toThrow('Project not found');
    await expect(outsider.client.query(api.teams.details, { workspaceId })).rejects.toThrow('administrator');
  });

  it('removes access immediately when a department grant is revoked', async () => {
    const { owner, sales, finance, projectId, salesDepartment } = await team();
    await owner.client.mutation(api.teams.revokeProjectGrant, { projectId, departmentId: salesDepartment });
    expect(await sales.client.query(api.projects.list, {})).toEqual([]);
    await expect(sales.client.query(api.projects.get, { id: projectId })).rejects.toThrow('Project not found');
    await expect(sales.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, title: 'After revocation' })).rejects.toThrow('Project not found');
    expect(await finance.client.query(api.projects.list, {})).toHaveLength(1);
  });

  it('removes access when membership is removed even if the department grant remains', async () => {
    const { owner, sales, workspaceId, projectId } = await team();
    await owner.client.mutation(api.teams.removeMember, { workspaceId, userId: sales.id });
    expect(await sales.client.query(api.teams.listWorkspaces, {})).toEqual([]);
    expect(await sales.client.query(api.projects.list, {})).toEqual([]);
    await expect(sales.client.query(api.projects.get, { id: projectId })).rejects.toThrow('Project not found');
  });

  it('enforces one department per account per workspace when an admin reassigns a member', async () => {
    const { owner, sales, workspaceId, projectId, financeDepartment } = await team();
    await owner.client.mutation(api.teams.setMember, { workspaceId, loginId: 'sales', departmentId: financeDepartment });
    const details = await owner.client.query(api.teams.details, { workspaceId });
    expect(details.members.filter((member) => member.userId === sales.id)).toHaveLength(1);
    expect((await sales.client.query(api.projects.get, { id: projectId })).effectiveRole).toBe('viewer');
    await expect(sales.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, title: 'Old privilege' })).rejects.toThrow('read-only');
  });

  it('rejects grants and memberships crossing workspace boundaries', async () => {
    const { owner, outsider, workspaceId, projectId } = await team();
    const second = await outsider.client.mutation(api.teams.createWorkspace, { name: 'Different company' });
    const department = await outsider.client.mutation(api.teams.createDepartment, { workspaceId: second, name: 'Sales' });
    await expect(owner.client.mutation(api.teams.setProjectGrant, { projectId, departmentId: department, role: 'editor' })).rejects.toThrow('same workspace');
    await expect(owner.client.mutation(api.teams.setMember, { workspaceId, loginId: 'sales', departmentId: department })).rejects.toThrow('this workspace');
    await expect(outsider.client.mutation(api.teams.attachProject, { workspaceId: second, projectId })).rejects.toThrow('Project not found');
    const another = await owner.client.mutation(api.teams.createWorkspace, { name: 'Another owned workspace' });
    await expect(owner.client.mutation(api.teams.attachProject, { workspaceId: another, projectId })).rejects.toThrow('already belongs');
  });

  it('requires an existing exact login and protects the workspace owner', async () => {
    const { owner, workspaceId, salesDepartment } = await team();
    await expect(owner.client.mutation(api.teams.setMember, { workspaceId, loginId: 'unknown', departmentId: salesDepartment })).rejects.toThrow('does not have an account');
    await expect(owner.client.mutation(api.teams.setMember, { workspaceId, loginId: 'owner', departmentId: salesDepartment })).rejects.toThrow('cannot be reassigned');
    await expect(owner.client.mutation(api.teams.removeMember, { workspaceId, userId: owner.id })).rejects.toThrow('cannot be removed');
    await expect(owner.client.mutation(api.teams.createDepartment, { workspaceId, name: ' sales ' })).rejects.toThrow('already exists');
  });

  it('rejects stale full-state saves with structured conflict details, preserving the newer source', async () => {
    const { owner, sales, projectId } = await team();
    const updated = JSON.stringify({ state: { files: [{ path: 'index.html', content: 'Newer source' }] } });
    await owner.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, stateJson: updated });
    try {
      await sales.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, stateJson: '{}' });
      throw new Error('A stale update should not succeed');
    } catch (error) {
      const raw = (error as { data?: unknown }).data;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      expect(data).toMatchObject({ code: 'REVISION_CONFLICT', currentRevision: 1 });
    }
    expect((await sales.client.query(api.projects.get, { id: projectId })).stateJson).toBe(updated);
  });

  it('preserves owner-only legacy projects and can explicitly attach one without cloning', async () => {
    const { t, owner, sales, workspaceId, salesDepartment } = await team();
    const legacy = await t.run((ctx) => ctx.db.insert('projects', { ...sample, ownerId: owner.id, archived: false, updatedAt: Date.now(), stage: 'draft' }));
    expect((await owner.client.query(api.projects.get, { id: legacy })).revision).toBe(0);
    await expect(sales.client.query(api.projects.get, { id: legacy })).rejects.toThrow('Project not found');
    expect(await owner.client.mutation(api.teams.attachProject, { workspaceId, projectId: legacy })).toBe(legacy);
    await owner.client.mutation(api.teams.setProjectGrant, { projectId: legacy, departmentId: salesDepartment, role: 'viewer' });
    expect((await sales.client.query(api.projects.get, { id: legacy }))._id).toBe(legacy);
    expect((await owner.client.query(api.projects.get, { id: legacy })).revision).toBe(1);
  });

  it('keeps anonymous and expired sessions out of team operations', async () => {
    const { t, workspaceId, projectId } = await team();
    await expect(t.query(api.teams.listWorkspaces, {})).rejects.toThrow('Unauthenticated');
    await expect(t.mutation(api.teams.createWorkspace, { name: 'Anonymous' })).rejects.toThrow('Unauthenticated');
    await expect(t.query(api.projects.get, { id: projectId })).rejects.toThrow('Unauthenticated');
    const expired = await account(t, 'expired', -1000);
    await expect(expired.client.query(api.teams.listWorkspaces, {})).rejects.toThrow('Unauthenticated');
    await expect(expired.client.query(api.teams.details, { workspaceId })).rejects.toThrow('Unauthenticated');
  });

  it('allows workspace admin management and revokes all department access after archival', async () => {
    const { owner, sales, finance, projectId } = await team();
    await owner.client.mutation(api.projects.archive, { id: projectId });
    expect(await sales.client.query(api.projects.list, {})).toEqual([]);
    expect(await finance.client.query(api.projects.list, {})).toEqual([]);
    await expect(sales.client.query(api.projects.get, { id: projectId })).rejects.toThrow('Project not found');
  });
  it('keeps newly shared apps discoverable after a department archives its previous 100 apps', async () => {
    const t = setup(); const owner = await account(t, 'archive.owner'); const member = await account(t, 'archive.member');
    const workspaceId = await owner.client.mutation(api.teams.createWorkspace, { name: 'Archive regression' });
    const departmentId = await owner.client.mutation(api.teams.createDepartment, { workspaceId, name: 'Operations' });
    await owner.client.mutation(api.teams.setMember, { workspaceId, loginId: 'archive.member', departmentId });
    for (let index = 0; index < 100; index += 1) {
      const projectId = await owner.client.mutation(api.projects.create, { ...sample, workspaceId });
      await owner.client.mutation(api.teams.setProjectGrant, { projectId, departmentId, role: 'viewer' });
      await owner.client.mutation(api.projects.archive, { id: projectId });
    }
    const activeId = await owner.client.mutation(api.projects.create, { ...sample, workspaceId });
    await owner.client.mutation(api.teams.setProjectGrant, { projectId: activeId, departmentId, role: 'editor' });
    const visible = await member.client.query(api.projects.list, {});
    expect(visible.map((project) => project._id)).toEqual([activeId]);
    expect((await member.client.query(api.projects.watch, { id: activeId }))?.effectiveRole).toBe('editor');
  }, 20_000);
  it('does not trust role or department claims inside editor-controlled workspace JSON', async () => {
    const { sales, projectId, salesDepartment } = await team();
    await sales.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, stateJson: JSON.stringify({ effectiveRole: 'owner', workspaceRole: 'admin', departmentId: salesDepartment }) });
    expect((await sales.client.query(api.projects.get, { id: projectId })).effectiveRole).toBe('editor');
    await expect(sales.client.mutation(api.teams.revokeProjectGrant, { projectId, departmentId: salesDepartment })).rejects.toThrow('administrator');
  });
  it('returns null from an active subscription immediately after revocation or session absence', async () => {
    const { t, owner, sales, projectId, salesDepartment } = await team();
    expect((await sales.client.query(api.projects.watch, { id: projectId }))?._id).toBe(projectId);
    expect(await t.query(api.projects.watch, { id: projectId })).toBeNull();
    await owner.client.mutation(api.teams.revokeProjectGrant, { projectId, departmentId: salesDepartment });
    expect(await sales.client.query(api.projects.watch, { id: projectId })).toBeNull();
  });
  it('lists lightweight metadata instead of full source and transactionally refreshes the catalog', async () => {
    const { owner, sales, projectId } = await team();
    const stateJson = JSON.stringify({ source: 'import', color: 'peach', state: { files: [{ path: 'source.txt', content: 'x'.repeat(580_000) }], versions: [{ id: 'one' }] } });
    await sales.client.mutation(api.projects.update, { id: projectId, expectedRevision: 0, stateJson, title: 'Changed catalog title', description: 'A'.repeat(1200) });
    const list = await owner.client.query(api.projects.list, {});
    expect(list[0]).toMatchObject({ _id: projectId, title: 'Changed catalog title', source: 'import', color: 'peach', revision: 1, versionCount: 1, stateLoaded: false });
    expect(list[0]).not.toHaveProperty('stateJson');
    expect(list[0].description).toHaveLength(600);
    expect(JSON.stringify(list).length).toBeLessThan(3000);
    expect((await sales.client.query(api.projects.watch, { id: projectId }))?.stateJson).toBe(stateJson);
    expect((await sales.client.query(api.projects.get, { id: projectId })).description).toHaveLength(1200);
  });
  it('explicitly backfills legacy cards in batches without changing ownership, source, or revisions', async () => {
    const t = setup(); const owner = await account(t, 'legacy.owner');
    const ids = await t.run(async (ctx) => {
      const results = [];
      for (let index = 0; index < 7; index += 1) results.push(await ctx.db.insert('projects', { ...sample, title: `Legacy ${index}`, ownerId: owner.id, archived: false, updatedAt: Date.now() + index, stage: 'draft' }));
      return results;
    });
    expect(await owner.client.query(api.projects.list, {})).toHaveLength(5);
    expect(await t.mutation(internal.catalog.backfillLegacy, {})).toEqual({ migrated: 5, done: false });
    expect(await t.mutation(internal.catalog.backfillLegacy, {})).toEqual({ migrated: 2, done: true });
    expect(await t.mutation(internal.catalog.backfillLegacy, {})).toEqual({ migrated: 0, done: true });
    const list = await owner.client.query(api.projects.list, {}); expect(list).toHaveLength(7);
    const project = await owner.client.query(api.projects.get, { id: ids[0] });
    expect(project).toMatchObject({ ownerId: owner.id, stateJson: sample.stateJson, revision: 0, effectiveRole: 'owner' });
  });
});
