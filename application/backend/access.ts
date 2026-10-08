import { ConvexError } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { authComponent } from './auth';

export type AccessCtx = QueryCtx | MutationCtx;
export type EffectiveRole = 'owner' | 'editor' | 'viewer';
export const missingProject = () => new ConvexError('Project not found.');
export async function memberOf(ctx: AccessCtx, workspaceId: Id<'workspaces'>, userId: string) {
  return ctx.db.query('workspaceMembers').withIndex('by_workspace_user', (q) => q.eq('workspaceId', workspaceId).eq('userId', userId)).unique();
}
export async function requireWorkspaceAdmin(ctx: AccessCtx, workspaceId: Id<'workspaces'>) {
  const actor = await authComponent.getAuthUser(ctx);
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace || workspace.ownerId !== actor._id) throw new ConvexError('Workspace administrator access required.');
  return { actor, workspace };
}
export async function projectAccessFor<T extends Pick<Doc<'projects'>, '_id' | 'ownerId' | 'archived' | 'workspaceId' | 'revision'>>(ctx: AccessCtx, project: T, userId: string) {
  if (project.archived) return null;
  const workspace = project.workspaceId ? await ctx.db.get(project.workspaceId) : null;
  const member = workspace ? await memberOf(ctx, workspace._id, userId) : null;
  const department = member ? await ctx.db.get(member.departmentId) : null;
  let effectiveRole: EffectiveRole | null = project.ownerId === userId || workspace?.ownerId === userId ? 'owner' : null;
  if (!effectiveRole && workspace && member && department?.workspaceId === workspace._id) {
    const grant = await ctx.db.query('projectGrants').withIndex('by_project_department', (q) => q.eq('projectId', project._id).eq('departmentId', department._id)).unique();
    if (grant?.workspaceId === workspace._id) effectiveRole = grant.role;
  }
  if (!effectiveRole) return null;
  const ownerMember = workspace ? await memberOf(ctx, workspace._id, project.ownerId) : null;
  const ownerDepartment = ownerMember ? await ctx.db.get(ownerMember.departmentId) : null;
  return {
    ...project, revision: project.revision ?? 0, effectiveRole,
    departmentName: department?.workspaceId === workspace?._id ? department?.name ?? null : null,
    ownerDepartment: ownerDepartment?.name ?? (workspace ? 'Workspace owner' : 'Personal workspace'),
    workspaceName: workspace?.name ?? null,
  };
}
export async function requireProjectAccess(ctx: AccessCtx, id: Id<'projects'>, level: 'view' | 'edit' | 'manage' = 'view') {
  const actor = await authComponent.getAuthUser(ctx);
  const project = await ctx.db.get(id);
  const access = project ? await projectAccessFor(ctx, project, actor._id) : null;
  if (!access) throw missingProject();
  if (level === 'manage' && access.effectiveRole !== 'owner') throw new ConvexError('Project owner or workspace administrator access required.');
  if (level === 'edit' && access.effectiveRole === 'viewer') throw new ConvexError('This project is read-only for your department.');
  return { actor, project: access };
}
