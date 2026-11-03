import { canTransition } from '#lib/domain/item-status.js';
import { canEditItems } from '#lib/domain/permissions.js';
import { ITEM_STATUSES, itemSchema, type Item, type ItemStatus } from '#lib/schemas/item.js';
import type { ItemSortKey, ItemsQuery } from '#lib/schemas/query.js';
import type { SessionUser } from '#lib/schemas/user.js';
import { normalize } from '#lib/text.js';
import itemsJson from '../../../../mocks/items.json';
import { parseCollection } from './validate';

export type ItemsPage = {
	total: number;
	pages: number;
	/** The page actually returned: a requested page past the end is clamped to the last one. */
	page: number;
	perPage: number;
	rows: Item[];
};

export type Owner = { id: string; name: string };

/** Why a write was refused; each code maps to a different response (401, 403, 404, 409). */
export type UpdateResult =
	| { ok: true; item: Item; changed: boolean }
	| { ok: false; code: 'unauthenticated' | 'forbidden' | 'not_found' }
	| { ok: false; code: 'bad_transition'; from: ItemStatus; to: ItemStatus };

export type ItemRepositoryOptions = {
	/** The clock, replaceable in tests. */
	now?: () => Date;
};

// Seconds precision, like the data: one format keeps string order equal to time order.
const stamp = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

// Names carry numbers ("#2" before "#10"), so compare them numerically and ignore case.
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
// Status sorts by lifecycle, not alphabetically: draft → … → archived.
const statusOrder = Object.fromEntries(ITEM_STATUSES.map((status, index) => [status, index]));

const comparators: Record<ItemSortKey, (a: Item, b: Item) => number> = {
	name: (a, b) => collator.compare(a.name, b.name),
	status: (a, b) => statusOrder[a.status] - statusOrder[b.status],
	channel: (a, b) => collator.compare(a.channel, b.channel),
	owner: (a, b) => collator.compare(a.owner.name, b.owner.name),
	budget: (a, b) => a.budget - b.budget,
	spent: (a, b) => a.spent - b.spent,
	ctr: (a, b) => a.ctr - b.ctr,
	// One ISO format throughout, so strings order like instants.
	updatedAt: (a, b) => (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0)
};

/**
 * Items treated as a real API: filtering, sorting and pagination happen here, on the server.
 * Validated once when the repository is built. Rows are replaced, never mutated in place, so a
 * page that was already returned stays consistent.
 */
export function createItemRepository(rawItems: unknown, options: ItemRepositoryOptions = {}) {
	const now = options.now ?? (() => new Date());
	const seed = parseCollection('mocks/items.json', itemSchema, rawItems, { id: (item) => item.id });
	let rows: readonly Item[] = seed;

	return {
		get(id: string): Item | undefined {
			return rows.find((item) => item.id === id);
		},

		/** Distinct owners, by name, for the owner filter. */
		listOwners(): Owner[] {
			const byId = new Map(rows.map((item) => [item.owner.id, item.owner]));
			return [...byId.values()].sort((a, b) => collator.compare(a.name, b.name));
		},

		query(query: ItemsQuery): ItemsPage {
			const needle = normalize(query.q);
			const matching = rows.filter(
				(item) =>
					(!needle || normalize(item.name).includes(needle)) &&
					(!query.status || item.status === query.status) &&
					(!query.channel || item.channel === query.channel) &&
					(!query.owner || item.owner.id === query.owner)
			);

			const direction = query.dir === 'asc' ? 1 : -1;
			const compare = comparators[query.sort];
			// Ties break on id, always ascending, so equal rows never swap between requests.
			matching.sort((a, b) => compare(a, b) * direction || a.id.localeCompare(b.id));

			const total = matching.length;
			const pages = Math.max(1, Math.ceil(total / query.perPage));
			const page = Math.min(query.page, pages);
			const start = (page - 1) * query.perPage;
			return {
				total,
				pages,
				page,
				perPage: query.perPage,
				rows: matching.slice(start, start + query.perPage)
			};
		},

		/**
		 * The only write: changes a campaign's status. Checked in this order, so a caller learns
		 * nothing it is not entitled to: who you are, what you may do, whether the row exists,
		 * whether the move is allowed. Asking for the status a row already has changes nothing.
		 */
		updateStatus(
			id: string,
			status: ItemStatus,
			actor: Pick<SessionUser, 'role'> | null | undefined
		): UpdateResult {
			if (!actor) return { ok: false, code: 'unauthenticated' };
			if (!canEditItems(actor)) return { ok: false, code: 'forbidden' };

			const item = rows.find((row) => row.id === id);
			if (!item) return { ok: false, code: 'not_found' };
			if (!canTransition(item.status, status)) {
				return { ok: false, code: 'bad_transition', from: item.status, to: status };
			}
			if (item.status === status) return { ok: true, item, changed: false };

			const updated: Item = { ...item, status, updatedAt: stamp(now()) };
			rows = rows.map((row) => (row.id === id ? updated : row));
			return { ok: true, item: updated, changed: true };
		}
	};
}

export type ItemRepository = ReturnType<typeof createItemRepository>;

/**
 * The app's repository. It holds edits in memory for the life of the server process, which is why
 * the dashboard has to run on a long-lived Node server (see "Rendering and runtimes" in the README).
 */
export const itemRepository = createItemRepository(itemsJson);
