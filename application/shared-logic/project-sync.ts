import type { Project } from '../types';

/**
 * Reconciles an authorized card listing without treating its abbreviated state
 * as a loaded project. Absent IDs leave the visible list, even when their draft
 * is retained separately for recovery. Access and owner always come from the
 * latest listing; a local edit never preserves an outdated permission grant.
 */
export function reconcileProjectCards(
  current: Project[],
  metadata: Project[],
  drafts: Map<string, Project>,
  isDirty: (id: string) => boolean,
): Project[] {
  const currentById = new Map(current.map((project) => [project.id, project]));
  return metadata.map((card) => {
    const local = drafts.get(card.id) ?? currentById.get(card.id);
    if (local && (isDirty(card.id) || (local.revision ?? 0) >= (card.revision ?? 0))) {
      return { ...local, access: card.access, ownerId: card.ownerId };
    }
    // A newer card invalidates the old full state. Its loading marker and state
    // are preserved as supplied; the active authorized query loads the source.
    return card;
  });
}
