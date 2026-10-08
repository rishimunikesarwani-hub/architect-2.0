import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const framework = v.union(
  v.literal('Auto-select'), v.literal('LangGraph'), v.literal('CrewAI'),
  v.literal('OpenAI Agents'), v.literal('Lyzr'), v.literal('Custom'),
);
export const stage = v.union(v.literal('draft'), v.literal('ready'), v.literal('deployed'));

export default defineSchema({
  projects: defineTable({
    ownerId: v.string(),
    title: v.string(),
    description: v.string(),
    framework,
    stage,
    // Workspace contains prototype files/settings; never credentials.
    stateJson: v.string(),
    updatedAt: v.number(),
    archived: v.boolean(),
    workspaceId: v.optional(v.id('workspaces')),
    revision: v.optional(v.number()),
    catalogued: v.optional(v.boolean()),
  }).index('by_owner_updated', ['ownerId', 'updatedAt']).index('by_workspace_updated', ['workspaceId', 'updatedAt'])
    .index('by_catalogued', ['catalogued']).index('by_owner_catalogued', ['ownerId', 'catalogued']),
  projectCatalog: defineTable({
    projectId: v.id('projects'), ownerId: v.string(), title: v.string(), description: v.string(), framework, stage,
    updatedAt: v.number(), archived: v.boolean(), workspaceId: v.optional(v.id('workspaces')), revision: v.number(),
    source: v.union(v.literal('prompt'), v.literal('import'), v.literal('template')), color: v.string(), versionCount: v.number(),
  }).index('by_project', ['projectId']).index('by_owner_active_updated', ['ownerId', 'archived', 'updatedAt'])
    .index('by_workspace_active_updated', ['workspaceId', 'archived', 'updatedAt']),
  workspaces: defineTable({ name: v.string(), ownerId: v.string(), createdAt: v.number() }).index('by_owner', ['ownerId']),
  departments: defineTable({ workspaceId: v.id('workspaces'), name: v.string(), normalizedName: v.string() }).index('by_workspace', ['workspaceId']),
  workspaceMembers: defineTable({ workspaceId: v.id('workspaces'), userId: v.string(), departmentId: v.id('departments'), addedAt: v.number() })
    .index('by_workspace_user', ['workspaceId', 'userId']).index('by_user', ['userId']).index('by_workspace', ['workspaceId']),
  projectGrants: defineTable({ projectId: v.id('projects'), departmentId: v.id('departments'), workspaceId: v.id('workspaces'), role: v.union(v.literal('editor'), v.literal('viewer')) })
    .index('by_project_department', ['projectId', 'departmentId']).index('by_department', ['departmentId']).index('by_workspace', ['workspaceId']),
});
