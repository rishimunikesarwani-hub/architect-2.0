import { describe, expect, it, vi } from 'vitest';
import { ProjectSaveQueue, type ProjectSaveResult } from '../application/shared-logic/project-save-queue';

type Project = { id: string; revision?: number; title: string };
const project = (id: string, revision = 0, title = id): Project => ({ id, revision, title });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function setup() {
  const writes: ReturnType<typeof deferred<ProjectSaveResult>>[] = [];
  const write = vi.fn((_project: Project, _expectedRevision: number) => {
    const operation = deferred<ProjectSaveResult>();
    writes.push(operation);
    return operation.promise;
  });
  const onSaved = vi.fn();
  const onFailure = vi.fn();
  const onPending = vi.fn();
  const queue = new ProjectSaveQueue<Project>({ write, onSaved, onFailure, onPending });
  return { queue, write, writes, onSaved, onFailure, onPending };
}

// Settling a deferred write resumes the queue in the next microtask.
const settle = () => Promise.resolve();

describe('revision-aware project saves', () => {
  it('serializes same-project edits and advances the baseline only after successful writes', async () => {
    const { queue, write, writes, onSaved, onPending } = setup();
    const first = project('app', 4, 'First edit');
    const second = project('app', 4, 'Second edit');
    queue.observe(first);
    queue.enqueue(first);
    queue.enqueue(second);
    expect(write.mock.calls).toEqual([[first, 4]]);
    expect(queue.hasPendingChanges()).toBe(true);

    writes[0].resolve({ id: 'app', revision: 5 });
    await settle();
    expect(write.mock.calls).toEqual([[first, 4], [second, 5]]);
    expect(queue.isDirty('app')).toBe(true);
    writes[1].resolve({ id: 'app', revision: 6 });
    await settle();
    expect(queue.hasPendingChanges()).toBe(false);
    expect(onSaved.mock.calls).toEqual([[first, { id: 'app', revision: 5 }], [second, { id: 'app', revision: 6 }]]);
    expect(onPending.mock.calls.flat()).toEqual([1, 2, 1, 0]);
  });

  it('keeps a dirty or blocked baseline when a newer remote revision arrives, including retry', async () => {
    const { queue, write, writes, onFailure } = setup();
    const local = project('app', 10, 'Local draft');
    queue.observe(local);
    queue.enqueue(local);
    queue.observe(project('app', 11, 'Remote edit'));
    const conflict = new Error('REVISION_CONFLICT');
    writes[0].reject(conflict);
    await settle();
    expect(onFailure).toHaveBeenCalledWith(local, conflict);
    expect(queue.isDirty('app')).toBe(true);
    expect(queue.isBlocked('app')).toBe(true);

    queue.observe(project('app', 11, 'Remote edit'));
    const latestDraft = project('app', 11, 'Preserved local retry');
    queue.retry(latestDraft);
    expect(write.mock.calls).toEqual([[local, 10], [latestDraft, 10]]);
    writes[1].reject(conflict);
    await settle();
    expect(queue.isBlocked('app')).toBe(true);
    expect(queue.hasPendingChanges()).toBe(true);
  });

  it('blocks later drafts after failure while another project can still finish', async () => {
    const { queue, write, writes, onPending } = setup();
    queue.enqueue(project('a', 1, 'First'));
    queue.enqueue(project('a', 1, 'Queued second'));
    queue.enqueue(project('b', 7, 'Independent edit'));
    expect(write.mock.calls.map(([p]) => p.id)).toEqual(['a', 'b']);
    writes[0].reject(new Error('Network failed'));
    await settle();
    queue.enqueue(project('a', 1, 'Newest blocked draft'));
    expect(write).toHaveBeenCalledTimes(2);
    expect(queue.isBlocked('a')).toBe(true);

    writes[1].resolve({ id: 'b', revision: 8 });
    await settle();
    expect(queue.isDirty('b')).toBe(false);
    expect(queue.hasPendingChanges()).toBe(true);
    expect(onPending).toHaveBeenLastCalledWith(0);

    const current = project('a', 1, 'Current draft for explicit retry');
    queue.retry(current);
    expect(write).toHaveBeenLastCalledWith(current, 1);
    writes[2].resolve({ id: 'a', revision: 2 });
    await settle();
    expect(queue.hasPendingChanges()).toBe(false);
    expect(queue.isBlocked('a')).toBe(false);
  });

  it.each(['success', 'failure'] as const)('ignores old account %s callbacks after reset', async (outcome) => {
    const { queue, write, writes, onSaved, onFailure, onPending } = setup();
    queue.enqueue(project('same-id', 3, 'Old account'));
    queue.enqueue(project('same-id', 3, 'Old queued draft'));
    queue.reset();
    expect(queue.hasPendingChanges()).toBe(false);
    const nextAccount = project('same-id', 20, 'New account');
    queue.observe(nextAccount);
    queue.enqueue(nextAccount);
    if (outcome === 'success') writes[0].resolve({ id: 'same-id', revision: 4 });
    else writes[0].reject(new Error('Old request failed'));
    await settle();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(onPending).toHaveBeenLastCalledWith(1);
    expect(write.mock.calls.map(([, revision]) => revision)).toEqual([3, 20]);
    expect(queue.isDirty('same-id')).toBe(true);
    writes[1].resolve({ id: 'same-id', revision: 21 });
    await settle();
    expect(onSaved).toHaveBeenCalledExactlyOnceWith(nextAccount, { id: 'same-id', revision: 21 });
    expect(queue.hasPendingChanges()).toBe(false);
    expect(onPending).toHaveBeenLastCalledWith(0);
  });

  it('accepts a remote revision after preserving a failed local draft, then saves against it', async () => {
    const { queue, write, writes } = setup();
    queue.enqueue(project('app', 2, 'Local draft'));
    writes[0].reject(new Error('REVISION_CONFLICT'));
    await settle();
    queue.acceptRemote(project('app', 8, 'Remote accepted'));
    expect(queue.hasPendingChanges()).toBe(false);
    expect(queue.isBlocked('app')).toBe(false);
    const merged = project('app', 8, 'User reapplied desired edit');
    queue.enqueue(merged);
    expect(write).toHaveBeenLastCalledWith(merged, 8);
    writes[1].resolve({ id: 'app', revision: 9 });
    await settle();
    expect(queue.isDirty('app')).toBe(false);
  });

  it('holds a restored draft without autosaving or adopting newer subscription revisions', async () => {
    const { queue, write, writes, onPending } = setup();
    queue.observe(project('app', 12, 'Current server copy'));
    const restored = project('app', 5, 'Unsaved draft from this account');
    queue.hold(restored);
    expect(write).not.toHaveBeenCalled();
    expect(queue.hasPendingChanges()).toBe(true);
    expect(queue.isBlocked('app')).toBe(true);
    expect(onPending).toHaveBeenLastCalledWith(0);
    queue.observe(project('app', 13, 'Later remote copy'));
    queue.retry(restored);
    expect(write).toHaveBeenCalledExactlyOnceWith(restored, 5);
    writes[0].reject(new Error('REVISION_CONFLICT'));
    await settle();
    expect(queue.isDirty('app')).toBe(true);
    expect(queue.isBlocked('app')).toBe(true);
  });

  it('holding an active project invalidates its old callbacks without affecting another project', async () => {
    const { queue, write, writes, onSaved, onPending } = setup();
    queue.enqueue(project('a', 2, 'Old in-flight draft'));
    queue.enqueue(project('a', 2, 'Old queued draft'));
    queue.enqueue(project('b', 4, 'Other app edit'));
    const held = project('a', 2, 'Preserved current draft');
    queue.hold(held);
    expect(onPending).toHaveBeenLastCalledWith(1);
    writes[0].resolve({ id: 'a', revision: 3 });
    await settle();
    expect(onSaved).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledTimes(2);
    expect(queue.isBlocked('a')).toBe(true);
    writes[1].resolve({ id: 'b', revision: 5 });
    await settle();
    expect(onPending).toHaveBeenLastCalledWith(0);
    expect(queue.isDirty('b')).toBe(false);
    expect(queue.isDirty('a')).toBe(true);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('ignores an in-flight callback after acceptRemote and does not subtract the new pending save', async () => {
    const { queue, write, writes, onSaved, onPending } = setup();
    queue.enqueue(project('app', 2, 'Old local'));
    queue.enqueue(project('app', 2, 'Old queued'));
    queue.acceptRemote(project('app', 9, 'Accepted remote'));
    const editedRemote = project('app', 9, 'Next edit');
    queue.enqueue(editedRemote);
    writes[0].resolve({ id: 'app', revision: 3 });
    await settle();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onPending).toHaveBeenLastCalledWith(1);
    expect(write.mock.calls.map(([, revision]) => revision)).toEqual([2, 9]);
    writes[1].resolve({ id: 'app', revision: 10 });
    await settle();
    expect(onSaved).toHaveBeenCalledExactlyOnceWith(editedRemote, { id: 'app', revision: 10 });
    expect(queue.hasPendingChanges()).toBe(false);
  });

  it('does not overwrite a remote update when an edit still contains the old rendered revision', async () => {
    const { queue, write, writes, onFailure } = setup();
    queue.observe(project('app', 2));
    queue.observe(project('app', 6));
    queue.observe(project('app', 3));
    const edit = project('app', 3, 'Edit from an old render');
    queue.enqueue(edit);
    expect(write).toHaveBeenLastCalledWith(edit, 3);
    const conflict = new Error('REVISION_CONFLICT: server is at revision 6');
    writes[0].reject(conflict);
    await settle();
    expect(onFailure).toHaveBeenCalledWith(edit, conflict);
    expect(queue.isBlocked('app')).toBe(true);
    expect(queue.hasPendingChanges()).toBe(true);
  });

  it('uses an applied remote revision and ignores delayed subscription snapshots', async () => {
    const { queue, write, writes } = setup();
    queue.observe(project('app', 2));
    queue.observe(project('app', 6));
    queue.observe(project('app', 3));
    const edit = project('app', 6, 'Edit from the applied remote version');
    queue.enqueue(edit);
    expect(write).toHaveBeenLastCalledWith(edit, 6);
    writes[0].resolve({ id: 'app', revision: 7 });
    await settle();
    queue.observe(project('app', 6));
    queue.enqueue(project('app', 7, 'Next edit after save acknowledgment'));
    expect(write.mock.calls.map(([, revision]) => revision)).toEqual([6, 7]);
    writes[1].resolve({ id: 'app', revision: 8 });
    await settle();
  });
});
