import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import { register } from '@convex-dev/better-auth/test';
import { api, components } from '../application/backend/_generated/api';
import schema from '../application/backend/schema';

const modules = import.meta.glob('../application/backend/**/*.{ts,js}');

function setup() {
  const t = convexTest(schema, modules);
  register(t);
  return t;
}

async function user(t: ReturnType<typeof setup>, name: string, expired = false) {
  // Fixture records live only in convex-test's in-memory component database.
  // Deployed auth functions have no fixture or testing path.
  const now = Date.now();
  const account = await t.mutation(components.betterAuth.adapter.create, {
    input: { model: 'user', data: { name, username: name.toLowerCase(), email: `${name}@example.invalid`, emailVerified: true, createdAt: now, updatedAt: now } },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: { model: 'session', data: {
      userId: account._id, expiresAt: now + (expired ? -1000 : 60_000),
      token: `fixture-session-${name}`, createdAt: now, updatedAt: now,
    } },
  });
  return { client: t.withIdentity({ subject: account._id, sessionId: session._id }), id: account._id };
}

const sample = { title: 'Research agent', description: 'A prototype workspace', framework: 'LangGraph' as const };

describe('project ownership and persistence', () => {
  it('rejects unauthenticated list and create', async () => {
    const t = setup();
    await expect(t.query(api.projects.list, {})).rejects.toThrow('Unauthenticated');
    await expect(t.mutation(api.projects.create, sample)).rejects.toThrow('Unauthenticated');
    expect(await t.query(api.auth.getCurrentUser, {})).toBeNull();
  }, 30_000); // Cold Better Auth compilation measured 17.6 s on Windows; assertions are unchanged.

  it('persists the full workspace and edits for its owner', async () => {
    const t = setup();
    const alice = await user(t, 'Alice');
    const state = { source: 'prompt', color: 'orange', state: { messages: [{ role: 'user', text: 'Build it' }], files: [{ path: 'main.py', content: 'print(1)' }], agents: [{ name: 'Researcher' }], connections: ['Knowledge base'], deployment: { status: 'simulated' } } };
    const id = await alice.client.mutation(api.projects.create, { ...sample, stateJson: JSON.stringify(state) });
    await alice.client.mutation(api.projects.update, { id, expectedRevision: 0, title: 'Updated agent', stage: 'ready' });
    const project = await alice.client.query(api.projects.get, { id });
    expect(project.ownerId).toBe(alice.id);
    expect(project.title).toBe('Updated agent');
    expect(project.stage).toBe('ready');
    expect(JSON.parse(project.stateJson)).toEqual(state);
    expect(await alice.client.query(api.projects.list, {})).toHaveLength(1);
  });

  it('prevents another owner from listing, reading, editing, or archiving a project', async () => {
    const t = setup();
    const alice = await user(t, 'Alice');
    const bob = await user(t, 'Bob');
    const id = await alice.client.mutation(api.projects.create, sample);
    expect(await bob.client.query(api.projects.list, {})).toEqual([]);
    await expect(bob.client.query(api.projects.get, { id })).rejects.toThrow('Project not found');
    await expect(bob.client.mutation(api.projects.update, { id, expectedRevision: 0, title: 'Stolen' })).rejects.toThrow('Project not found');
    await expect(bob.client.mutation(api.projects.archive, { id })).rejects.toThrow('Project not found');
    expect((await alice.client.query(api.projects.get, { id })).title).toBe(sample.title);
  });

  it('rejects anonymous access to an existing project on every operation', async () => {
    const t = setup();
    const alice = await user(t, 'Alice');
    const id = await alice.client.mutation(api.projects.create, sample);
    await expect(t.query(api.projects.get, { id })).rejects.toThrow('Unauthenticated');
    await expect(t.mutation(api.projects.update, { id, expectedRevision: 0, title: 'Changed' })).rejects.toThrow('Unauthenticated');
    await expect(t.mutation(api.projects.archive, { id })).rejects.toThrow('Unauthenticated');
  });

  it('requires a real unexpired session, even for a known user identity', async () => {
    const t = setup();
    const alice = await user(t, 'Alice', true);
    await expect(alice.client.query(api.projects.list, {})).rejects.toThrow('Unauthenticated');
    const identityOnly = t.withIdentity({ subject: alice.id });
    await expect(identityOnly.mutation(api.projects.create, sample)).rejects.toThrow();
  });

  it('archives recoverably and removes the archived project from ordinary access', async () => {
    const t = setup();
    const alice = await user(t, 'Alice');
    const id = await alice.client.mutation(api.projects.create, sample);
    await alice.client.mutation(api.projects.archive, { id });
    expect(await alice.client.query(api.projects.list, {})).toEqual([]);
    await expect(alice.client.query(api.projects.get, { id })).rejects.toThrow('Project not found');
    expect((await t.run((ctx) => ctx.db.get(id)))?.archived).toBe(true);
  });

  it('rejects invalid and oversized data before writing', async () => {
    const t = setup();
    const alice = await user(t, 'Alice');
    await expect(alice.client.mutation(api.projects.create, { ...sample, title: ' ' })).rejects.toThrow('title');
    await expect(alice.client.mutation(api.projects.create, { ...sample, stateJson: '{bad' })).rejects.toThrow('valid JSON');
    await expect(alice.client.mutation(api.projects.create, { ...sample, stateJson: '[]' })).rejects.toThrow('valid JSON');
    await expect(alice.client.mutation(api.projects.create, { ...sample, stateJson: JSON.stringify({ file: 'a'.repeat(600_000) }) })).rejects.toThrow('600 KB');
    expect(await alice.client.query(api.projects.list, {})).toEqual([]);
  });
});
