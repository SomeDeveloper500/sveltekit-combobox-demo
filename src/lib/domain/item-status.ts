import type { ItemStatus } from '#lib/schemas/item.js';

/**
 * The campaign lifecycle: which status may follow which. Pure and shared, so the server enforces
 * it on every write and the client offers only the moves that can succeed.
 *
 *   draft → scheduled → active ⇄ paused → completed → archived
 *
 * Archiving is a one-way street, and `active` must be paused or completed first.
 */
export const TRANSITIONS: Readonly<Record<ItemStatus, readonly ItemStatus[]>> = {
	draft: ['scheduled', 'archived'],
	scheduled: ['draft', 'active', 'archived'],
	active: ['paused', 'completed'],
	paused: ['active', 'completed', 'archived'],
	completed: ['archived'],
	archived: []
};

/** The statuses a row in `from` may move to (not including itself). */
export function allowedTransitions(from: ItemStatus): readonly ItemStatus[] {
	return TRANSITIONS[from];
}

/** Staying where you are is always allowed; it simply changes nothing. */
export function canTransition(from: ItemStatus, to: ItemStatus): boolean {
	return from === to || TRANSITIONS[from].includes(to);
}

/**
 * Statuses a row can never leave the way it came: there is no way back to a live campaign.
 * Entering one is what deserves a confirmation.
 */
const IRREVERSIBLE: ReadonlySet<ItemStatus> = new Set(['completed', 'archived']);

export function isIrreversible(status: ItemStatus): boolean {
	return IRREVERSIBLE.has(status);
}
