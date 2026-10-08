import type { Doc } from './_generated/dataModel';
import { internalMutation, type MutationCtx } from './_generated/server';

export function metadata(project: Doc<'projects'>) {
  let source: 'prompt' | 'import' | 'template' = 'prompt'; let color = 'mint'; let versionCount = 0;
  try {
    const envelope = JSON.parse(project.stateJson) as { source?: unknown; color?: unknown; state?: { versions?: unknown } };
    if (envelope.source === 'import' || envelope.source === 'template') source = envelope.source;
    if (typeof envelope.color === 'string' && /^[a-z][a-z0-9-]{0,24}$/.test(envelope.color)) color = envelope.color;
    if (Array.isArray(envelope.state?.versions)) versionCount = Math.min(envelope.state.versions.length, 1000);
  } catch { /* Legacy malformed presentation data uses neutral card metadata. */ }
  return {
    projectId: project._id, ownerId: project.ownerId, title: project.title,
    // Cards need a short excerpt; the complete description and state stay in get.
    description: project.description.slice(0, 600), framework: project.framework, stage: project.stage,
    updatedAt: project.updatedAt, archived: project.archived, revision: project.revision ?? 0,
    ...(project.workspaceId ? { workspaceId: project.workspaceId } : {}), source, color, versionCount,
  };
}
export async function syncCatalog(ctx: MutationCtx, project: Doc<'projects'>) {
  const existing = await ctx.db.query('projectCatalog').withIndex('by_project', (q) => q.eq('projectId', project._id)).unique();
  const value = metadata(project);
  if (existing) await ctx.db.replace(existing._id, value); else await ctx.db.insert('projectCatalog', value);
  if (!project.catalogued) await ctx.db.patch(project._id, { catalogued: true });
}

// Explicit admin/CLI migration, never scheduled or invoked on deployment.
// Each call handles at most five <=600 KB legacy source documents.
export const backfillLegacy = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query('projects').withIndex('by_catalogued', (q) => q.eq('catalogued', undefined)).take(5);
    for (const project of projects) await syncCatalog(ctx, project);
    return { migrated: projects.length, done: projects.length < 5 };
  },
});
