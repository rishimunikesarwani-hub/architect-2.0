import { describe, expect, it } from 'vitest';
import type { WorkspaceState } from '../application/types';
import { parseCloudState } from '../application/shared-logic/parse-cloud-state';

const state: WorkspaceState = {
  theme: 'Sage', messages: [{ id: 'message', role: 'assistant', text: 'Ready', time: '2026-10-05' }],
  files: [{ path: 'index.html', content: '<h1>Shared source</h1>' }],
  agents: [{ name: 'Reviewer', role: 'Review', model: 'Not connected', instructions: 'Review the draft',
    knowledge: [{ id: 'knowledge', kind: 'text', title: 'Guide', value: 'Context' }],
    testSample: { input: 'Question', output: 'Sample response', at: '2026-10-05' } }],
  connections: ['Slack'], versions: [{ id: 'version', label: 'Initial version', at: '2026-10-05', files: [{ path: 'index.html', content: '<h1>Before</h1>' }] }],
  plan: { goal: 'Review', inputs: 'Context', steps: 'Prepare a draft', approval: 'Human review', status: 'approved' },
  github: { repository: 'https://github.com/example/sample', branch: 'main', lastSync: '2026-10-05' },
  deployment: { slug: 'sample', environment: 'Preview', status: 'simulated', at: '2026-10-05' },
  testRun: { at: '2026-10-05', passed: 2, total: 4 },
};

describe('untrusted cloud workspace state', () => {
  it('round-trips every supported field without changing source or checkpoints', () => {
    expect(parseCloudState(JSON.stringify({ state, source: 'import', color: 'peach' })))
      .toEqual({ state, source: 'import', color: 'peach', invalid: false });
  });
  it('accepts legacy envelopes without state and empty but complete workspaces', () => {
    expect(parseCloudState('{}')).toEqual({ state: null, source: 'prompt', color: 'mint', invalid: false });
    const empty = { messages: [], files: [], agents: [], connections: [], versions: [], theme: 'Sage' };
    expect(parseCloudState(JSON.stringify({ state: empty })).state).toEqual(empty);
  });
  it.each(['not JSON', 'null', '[]', '"text"', '{"state":null}', '{"state":{}}', '{"state":[]}'])('rejects malformed state: %s', (input) => {
    expect(parseCloudState(input)).toMatchObject({ state: null, invalid: true });
  });
  it.each(['messages', 'files', 'agents', 'connections', 'versions', 'theme'])('rejects a missing required field: %s', (key) => {
    const incomplete: Record<string, unknown> = { ...state }; delete incomplete[key];
    expect(parseCloudState(JSON.stringify({ state: incomplete }))).toMatchObject({ state: null, invalid: true });
  });
  it.each([
    { messages: [{ id: 'x', role: 'admin', text: 'Untrusted', time: 'today' }] },
    { files: [{ path: 'index.html', content: { invalid: true } }] },
    { agents: [{ ...state.agents[0], instructions: null }] },
    { agents: [{ ...state.agents[0], knowledge: [{ id: 'x', kind: 'file', title: 'Guide', value: 'Text' }] }] },
    { agents: [{ ...state.agents[0], testSample: { input: 'Question', output: [] } }] },
    { connections: [false] },
    { versions: [{ ...state.versions[0], files: [{ path: 'index.html' }] }] },
    { plan: { ...state.plan, status: 'running' } },
    { github: { ...state.github, lastSync: 123 } },
    { deployment: { ...state.deployment, slug: [] } },
    { testRun: { at: 'today', passed: '2', total: 4 } },
    { testRun: { at: 'today', passed: 5, total: 4 } },
    { testRun: { at: 'today', passed: 0, total: -1 } },
    { plan: null },
  ])('rejects malformed nested fields: %j', (fields) => {
    expect(parseCloudState(JSON.stringify({ state: { ...state, ...fields } }))).toMatchObject({ state: null, invalid: true });
  });
  it('uses neutral metadata for unexpected source and CSS class values', () => {
    expect(parseCloudState(JSON.stringify({ state, source: {}, color: 'mint injected-class' })))
      .toEqual({ state, source: 'prompt', color: 'mint', invalid: false });
  });
});
