import { ConvexError, v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { components } from './_generated/api';
import { authComponent } from './auth';
import { memberOf, requireProjectAccess, requireWorkspaceAdmin } from './access';
import { syncCatalog } from './catalog';

function boundedName(value: string) {
  const name = value.trim();
  if (name.length < 2 || name.length > 80) throw new ConvexError('Use a name between 2 and 80 characters.');
  return name;
}

export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const owned = await ctx.db.query('workspaces').withIndex('by_owner', (q) => q.eq('ownerId', user._id)).take(20);
    const memberships = await ctx.db.query('workspaceMembers').withIndex('by_user', (q) => q.eq('userId', user._id)).take(20);
    const shared = await Promise.all(memberships.map(async (member) => {
      const workspace = await ctx.db.get(member.workspaceId); const department = await ctx.db.get(member.departmentId);
      return workspace && department?.workspaceId === workspace._id ? { ...workspace, role: 'member' as const, departmentId: department._id, departmentName: department.name } : null;
    }));
    return [...owned.map((workspace) => ({ ...workspace, role: 'admin' as const, departmentId: null, departmentName: null })), ...shared.filter((workspace) => workspace !== null && !owned.some((own) => own._id === workspace._id))];
  },
});
export const createWorkspace = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const actor = await authComponent.getAuthUser(ctx);
    if ((await ctx.db.query('workspaces').withIndex('by_owner', (q) => q.eq('ownerId', actor._id)).take(20)).length >= 20) throw new ConvexError('Workspace limit reached (20).');
    return ctx.db.insert('workspaces', { name: boundedName(name), ownerId: actor._id, createdAt: Date.now() });
  },
});
export const details = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, { workspaceId }) => {
    const { workspace } = await requireWorkspaceAdmin(ctx, workspaceId);
    const departments = await ctx.db.query('departments').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId)).take(100);
    const members = await ctx.db.query('workspaceMembers').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId)).take(100);
    const enrichedMembers = await Promise.all(members.map(async (member) => {
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, { model: 'user', where: [{ field: '_id', value: member.userId }] });
      return { ...member, loginId: user?.username ?? '', name: user?.name ?? 'Unavailable account', departmentName: departments.find((department) => department._id === member.departmentId)?.name ?? 'Unavailable department' };
    }));
    const projects = await ctx.db.query('projectCatalog').withIndex('by_workspace_active_updated', (q) => q.eq('workspaceId', workspaceId).eq('archived', false)).order('desc').take(100);
    const grants = await ctx.db.query('projectGrants').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId)).take(1000);
    return { workspace, role: 'admin' as const, departments, members: enrichedMembers, projects: projects.map(({ projectId, title, ownerId }) => ({ _id: projectId, title, ownerId })), grants: grants.filter((grant) => projects.some((project) => project.projectId === grant.projectId)) };
  },
});
export const createDepartment = mutation({
  args: { workspaceId: v.id('workspaces'), name: v.string() },
  handler: async (ctx, { workspaceId, name: value }) => {
    await requireWorkspaceAdmin(ctx, workspaceId);
    const name = boundedName(value); const normalizedName = name.toLowerCase();
    const existing = await ctx.db.query('departments').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId)).take(100);
    if (existing.some((department) => department.normalizedName === normalizedName)) throw new ConvexError('A department with that name already exists.');
    if (existing.length >= 100) throw new ConvexError('Department limit reached (100).');
    return ctx.db.insert('departments', { workspaceId, name, normalizedName });
  },
});
export const setMember = mutation({
  args: { workspaceId: v.id('workspaces'), loginId: v.string(), departmentId: v.id('departments') },
  handler: async (ctx, { workspaceId, loginId, departmentId }) => {
    const { workspace } = await requireWorkspaceAdmin(ctx, workspaceId);
    const department = await ctx.db.get(departmentId);
    if (department?.workspaceId !== workspaceId) throw new ConvexError('Choose a department in this workspace.');
    const normalized = loginId.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._]{2,39}$/.test(normalized)) throw new ConvexError('Enter the account’s exact login ID (3–40 letters, numbers, dots, or underscores).');
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, { model: 'user', where: [{ field: 'username', value: normalized }] });
    if (!user) throw new ConvexError('That login ID does not have an account yet. Ask the person to create an account first.');
    if (user._id === workspace.ownerId) throw new ConvexError('The workspace owner retains administrator access and cannot be reassigned as a department member.');
    const existing = await memberOf(ctx, workspaceId, user._id);
    if (existing) { await ctx.db.patch(existing._id, { departmentId }); return existing._id; }
    if ((await ctx.db.query('workspaceMembers').withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId)).take(100)).length >= 100) throw new ConvexError('Workspace member limit reached (100).');
    if ((await ctx.db.query('workspaceMembers').withIndex('by_user', (q) => q.eq('userId', user._id)).take(20)).length >= 20) throw new ConvexError('This account has reached its workspace membership limit (20).');
    return ctx.db.insert('workspaceMembers', { workspaceId, userId: user._id, departmentId, addedAt: Date.now() });
  },
});
export const removeMember = mutation({
  args: { workspaceId: v.id('workspaces'), userId: v.string() },
  handler: async (ctx, { workspaceId, userId }) => {
    const { workspace } = await requireWorkspaceAdmin(ctx, workspaceId);
    if (workspace.ownerId === userId) throw new ConvexError('The workspace owner cannot be removed.');
    const member = await memberOf(ctx, workspaceId, userId); if (member) await ctx.db.delete(member._id);
    return null;
  },
});
export const attachProject = mutation({
  args: { workspaceId: v.id('workspaces'), projectId: v.id('projects') },
  handler: async (ctx, { workspaceId, projectId }) => {
    const { actor } = await requireWorkspaceAdmin(ctx, workspaceId);
    const { project } = await requireProjectAccess(ctx, projectId, 'manage');
    if (project.ownerId !== actor._id) throw new ConvexError('Only your own projects can be attached.');
    if (project.workspaceId && project.workspaceId !== workspaceId) throw new ConvexError('This app already belongs to another workspace.');
    if (!project.workspaceId) {
      if ((await ctx.db.query('projectCatalog').withIndex('by_workspace_active_updated', (q) => q.eq('workspaceId', workspaceId).eq('archived', false)).take(100)).length >= 100) throw new ConvexError('Shared-app limit reached (100).');
      await ctx.db.patch(projectId, { workspaceId, revision: project.revision + 1, updatedAt: Date.now() });
    }
    const saved = await ctx.db.get(projectId); if (saved) await syncCatalog(ctx, saved);
    return projectId;
  },
});
export const setProjectGrant = mutation({
  args: { projectId: v.id('projects'), departmentId: v.id('departments'), role: v.union(v.literal('editor'), v.literal('viewer')) },
  handler: async (ctx, { projectId, departmentId, role }) => {
    const { project } = await requireProjectAccess(ctx, projectId, 'manage');
    const department = await ctx.db.get(departmentId);
    if (!project.workspaceId || department?.workspaceId !== project.workspaceId) throw new ConvexError('App and department must belong to the same workspace.');
    const existing = await ctx.db.query('projectGrants').withIndex('by_project_department', (q) => q.eq('projectId', projectId).eq('departmentId', departmentId)).unique();
    if (existing) { await ctx.db.patch(existing._id, { role }); return existing._id; }
    if ((await ctx.db.query('projectGrants').withIndex('by_workspace', (q) => q.eq('workspaceId', project.workspaceId!)).take(1000)).length >= 1000) throw new ConvexError('Workspace grant limit reached (1000).');
    return ctx.db.insert('projectGrants', { projectId, departmentId, role, workspaceId: project.workspaceId });
  },
});
export const revokeProjectGrant = mutation({
  args: { projectId: v.id('projects'), departmentId: v.id('departments') },
  handler: async (ctx, { projectId, departmentId }) => {
    const { project } = await requireProjectAccess(ctx, projectId, 'manage');
    const department = await ctx.db.get(departmentId);
    if (!project.workspaceId || department?.workspaceId !== project.workspaceId) throw new ConvexError('App and department must belong to the same workspace.');
    const grant = await ctx.db.query('projectGrants').withIndex('by_project_department', (q) => q.eq('projectId', projectId).eq('departmentId', departmentId)).unique();
    if (grant) await ctx.db.delete(grant._id);
    return null;
  },
});
