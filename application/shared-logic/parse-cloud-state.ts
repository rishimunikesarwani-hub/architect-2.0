import type { Project, WorkspaceState } from '../types';

type RecordValue = Record<string, unknown>;
type Check = (value: unknown) => boolean;
const object = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value);
const string: Check = (value) => typeof value === 'string';
const strings = (value: unknown, keys: string[]): value is RecordValue => object(value) && keys.every((key) => string(value[key]));
const array = (value: unknown, check: Check): boolean => Array.isArray(value) && value.every(check);
const optional = (value: RecordValue, key: string, check: Check): boolean => !Object.hasOwn(value, key) || check(value[key]);
const oneOf = (value: unknown, choices: string[]) => typeof value === 'string' && choices.includes(value);
const file: Check = (value) => strings(value, ['path', 'content']);
const count: Check = (value) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function validState(value: unknown): value is WorkspaceState {
  return strings(value, ['theme'])
    && array(value.messages, (item) => strings(item, ['id', 'text', 'time']) && oneOf(item.role, ['user', 'assistant']))
    && array(value.files, file)
    && array(value.agents, (item) => strings(item, ['name', 'role', 'model', 'instructions'])
      && optional(item, 'knowledge', (items) => array(items, (entry) => strings(entry, ['id', 'title', 'value']) && oneOf(entry.kind, ['url', 'text'])))
      && optional(item, 'testSample', (sample) => strings(sample, ['input', 'output', 'at'])))
    && array(value.connections, string)
    && array(value.versions, (item) => strings(item, ['id', 'label', 'at']) && array(item.files, file))
    && optional(value, 'plan', (plan) => strings(plan, ['goal', 'inputs', 'steps', 'approval']) && oneOf(plan.status, ['draft', 'approved']))
    && optional(value, 'github', (github) => strings(github, ['repository', 'branch']) && optional(github, 'lastSync', string))
    && optional(value, 'deployment', (deployment) => strings(deployment, ['slug', 'environment', 'status', 'at']))
    && optional(value, 'testRun', (run) => strings(run, ['at']) && count(run.passed) && count(run.total)
      && typeof run.passed === 'number' && typeof run.total === 'number' && run.passed <= run.total);
}

/** Reject malformed shared state without replacing or discarding the source JSON. */
export function parseCloudState(stateJson: string): {
  state: WorkspaceState | null; source: Project['source']; color: string; invalid: boolean;
} {
  let envelope: unknown;
  try { envelope = JSON.parse(stateJson); } catch { return { state: null, source: 'prompt', color: 'mint', invalid: true }; }
  if (!object(envelope)) return { state: null, source: 'prompt', color: 'mint', invalid: true };
  const source: Project['source'] = envelope.source === 'import' || envelope.source === 'template' ? envelope.source : 'prompt';
  const color = typeof envelope.color === 'string' && /^[a-z][a-z0-9-]{0,24}$/.test(envelope.color) ? envelope.color : 'mint';
  if (!Object.hasOwn(envelope, 'state')) return { state: null, source, color, invalid: false };
  return validState(envelope.state)
    ? { state: envelope.state, source, color, invalid: false }
    : { state: null, source, color, invalid: true };
}
