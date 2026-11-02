import { describe, expect, it } from 'vitest';
import { ITEM_STATUSES, type ItemStatus } from '#lib/schemas/item.js';
import { TRANSITIONS, allowedTransitions, canTransition, isIrreversible } from './item-status';
import { canEditItems } from './permissions';

describe('the status lifecycle', () => {
	it('has a rule for every status and only points at real statuses', () => {
		expect(Object.keys(TRANSITIONS).sort()).toEqual([...ITEM_STATUSES].sort());
		for (const targets of Object.values(TRANSITIONS)) {
			for (const target of targets) expect(ITEM_STATUSES).toContain(target);
		}
	});

	it('never lists a status as its own next step', () => {
		for (const status of ITEM_STATUSES) expect(allowedTransitions(status)).not.toContain(status);
	});

	it('makes archived a dead end', () => {
		expect(allowedTransitions('archived')).toEqual([]);
		for (const status of ITEM_STATUSES) {
			if (status !== 'archived') expect(canTransition('archived', status)).toBe(false);
		}
	});

	it('lets every other status reach archived, directly or through others', () => {
		const reaches = (from: ItemStatus, seen = new Set<ItemStatus>()): boolean => {
			if (from === 'archived') return true;
			if (seen.has(from)) return false;
			seen.add(from);
			return TRANSITIONS[from].some((next) => reaches(next, seen));
		};
		for (const status of ITEM_STATUSES) expect(reaches(status)).toBe(true);
	});

	it('allows the intended moves', () => {
		expect(canTransition('draft', 'scheduled')).toBe(true);
		expect(canTransition('scheduled', 'active')).toBe(true);
		expect(canTransition('active', 'paused')).toBe(true);
		expect(canTransition('paused', 'active')).toBe(true);
		expect(canTransition('active', 'completed')).toBe(true);
		expect(canTransition('completed', 'archived')).toBe(true);
	});

	it('refuses moves that skip or reverse the lifecycle', () => {
		expect(canTransition('draft', 'active')).toBe(false);
		expect(canTransition('active', 'archived')).toBe(false);
		expect(canTransition('completed', 'active')).toBe(false);
		expect(canTransition('completed', 'draft')).toBe(false);
	});

	it('treats staying put as allowed, so a repeated request is harmless', () => {
		for (const status of ITEM_STATUSES) expect(canTransition(status, status)).toBe(true);
	});

	it('flags the statuses with no way back to a live campaign', () => {
		expect(ITEM_STATUSES.filter(isIrreversible)).toEqual(['completed', 'archived']);
	});
});

describe('canEditItems', () => {
	it('lets admins and editors edit', () => {
		expect(canEditItems({ role: 'admin' })).toBe(true);
		expect(canEditItems({ role: 'editor' })).toBe(true);
	});

	it('keeps viewers and anonymous visitors read-only', () => {
		expect(canEditItems({ role: 'viewer' })).toBe(false);
		expect(canEditItems(null)).toBe(false);
		expect(canEditItems(undefined)).toBe(false);
	});
});
