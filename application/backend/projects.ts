import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authComponent } from './auth';
import { framework, stage } from './schema';
import { projectAccessFor, requireProjectAccess, requireWorkspaceAdmin } from './access';
import { metadata, syncCatalog } from './catalog';

const MAX_WORKSPACE_BYTES = 600_000;

function validTitle(title: string) {
  const result = title.trim();
  if (result.length < 1 || result.length > 120) throw new ConvexError('Project title must be 1–120 characters.');
  return result;
}

function validDescription(description: string) {
  if (description.length > 12_000) throw new ConvexError('Description is too long.');
  return description;
}

function validState(stateJson: string) {
  if (new TextEncoder().encode(stateJson).length > MAX_WORKSPACE_BYTES) {
    throw new ConvexError('Workspace is too large to save (600 KB maximum). Export a backup before reducing its contents.');
  }
  try {
    const parsed = JSON.parse(stateJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected an object');
  } catch {
    throw new ConvexError('Workspace must be a valid JSON object.');
  }
  return stateJson;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const own = await ctx.db.query('projectCatalog').withIndex('by_owner_active_updated', (q) => q.eq('ownerId', user._id).eq('archived', false)).order('desc').take(100);
    const memberships = await ctx.db.query('workspaceMembers').withIndex('by_user', (q) => q.eq('userId', user._id)).take(20);
    const adminWorkspaces = await ctx.db.query('workspaces').withIndex('by_owner', (q) => q.eq('ownerId', user._id)).take(20);
    const administered = (await Promise.all(adminWorkspaces.map((workspace) => ctx.db.query('projectCatalog').withIndex('by_workspace_active_updated', (q) => q.eq('workspaceId', workspace._id).eq('archived', false)).order('desc').take(100)))).flat();
    const grants = (await Promise.all(memberships.map((member) => ctx.db.query('projectGrants').withIndex('by_department', (q) => q.eq('departmentId', member.departmentId)).take(100)))).flat();
    const cards = new Map([...own, ...administered].map((card) => [card.projectId, { ...card, _id: card.projectId }]));
    const sharedIds = [...new Set(grants.map((grant) => grant.projectId))].filter((id) => !cards.has(id));
    // Keep concurrent database operations well below Convex's 1,000-operation limit.
    for (let offset = 0; offset < sharedIds.length; offset += 50) {
      const batch = await Promise.all(sharedIds.slice(offset, offset + 50).map((id) => ctx.db.query('projectCatalog').withIndex('by_project', (q) => q.eq('projectId', id)).unique()));
      for (const card of batch) if (card && !card.archived) cards.set(card.projectId, { ...card, _id: card.projectId });
    }
    // Transitional owner-only fallback is bounded to five source documents. Run
    // internal.catalog.backfillLegacy before release to catalog all legacy apps.
    const legacy = await ctx.db.query('projects').withIndex('by_owner_catalogued', (q) => q.eq('ownerId', user._id).eq('catalogued', undefined)).take(5);
    for (const project of legacy) if (!project.archived) cards.set(project._id, { ...metadata(project), _id: project._id, _creationTime: project._creationTime });
    const selected = [...cards.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100);
    const candidates = await Promise.all(selected.map((card) => projectAccessFor(ctx, card, user._id)));
    return candidates.filter((project) => project !== null).map((project) => ({ ...project, stateLoaded: false as const }));
  },
});

export const get = query({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => (await requireProjectAccess(ctx, id)).project,
});

// A reactive active-project subscription can safely lose authorization after
// revocation or session expiry without throwing through the React render tree.
export const watch = query({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    const project = await ctx.db.get(id);
    return project ? projectAccessFor(ctx, project, user._id) : null;
  },
});

export const create = mutation({
  args: { title: v.string(), description: v.string(), framework, stateJson: v.optional(v.string()), workspaceId: v.optional(v.id('workspaces')) },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (args.workspaceId) {
      await requireWorkspaceAdmin(ctx, args.workspaceId);
      if ((await ctx.db.query('projectCatalog').withIndex('by_workspace_active_updated', (q) => q.eq('workspaceId', args.workspaceId!).eq('archived', false)).take(100)).length >= 100) throw new ConvexError('Shared-app limit reached (100).');
    }
    const id = await ctx.db.insert('projects', {
      ownerId: user._id,
      title: validTitle(args.title),
      description: validDescription(args.description),
      framework: args.framework,
      stateJson: validState(args.stateJson ?? '{}'),
      stage: 'draft', updatedAt: Date.now(), archived: false,
      revision: 0,
      ...(args.workspaceId ? { workspaceId: args.workspaceId } : {}),
    });
    const project = await ctx.db.get(id); if (project) await syncCatalog(ctx, project);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('projects'), expectedRevision: v.number(), title: v.optional(v.string()), description: v.optional(v.string()),
    framework: v.optional(framework), stage: v.optional(stage), stateJson: v.optional(v.string()),
  },
  handler: async (ctx, { id, expectedRevision, ...args }) => {
    const { project } = await requireProjectAccess(ctx, id, 'edit');
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new ConvexError('Invalid project revision.');
    if (expectedRevision !== project.revision) throw new ConvexError({ code: 'REVISION_CONFLICT', message: 'This app changed in another session. Reload the saved version before applying your local changes.', currentRevision: project.revision });
    const revision = project.revision + 1;
    const changes: Record<string, string | number> = { updatedAt: Date.now(), revision };
    if (args.title !== undefined) changes.title = validTitle(args.title);
    if (args.description !== undefined) changes.description = validDescription(args.description);
    if (args.framework !== undefined) changes.framework = args.framework;
    if (args.stage !== undefined) changes.stage = args.stage;
    if (args.stateJson !== undefined) changes.stateJson = validState(args.stateJson);
    await ctx.db.patch(id, changes);
    const saved = await ctx.db.get(id); if (saved) await syncCatalog(ctx, saved);
    return { id, revision };
  },
});

export const archive = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, { id }) => {
    const { project } = await requireProjectAccess(ctx, id, 'manage');
    await ctx.db.patch(id, { archived: true, updatedAt: Date.now(), revision: project.revision + 1 });
    // At most one grant per department, with at most 100 departments in a
    // workspace. Archived grants must not consume a member's active-app window.
    const grants = await ctx.db.query('projectGrants').withIndex('by_project_department', (q) => q.eq('projectId', id)).take(100);
    for (const grant of grants) await ctx.db.delete(grant._id);
    const saved = await ctx.db.get(id); if (saved) await syncCatalog(ctx, saved);
    return id;
  },
});
