import { z } from 'zod';
import { ITEM_CHANNELS, ITEM_STATUSES } from './item';

/**
 * Query contracts parsed from the URL. A URL is user input and may be stale or hand-edited, so a
 * bad value never throws: each field falls back to its default (`catch`) and the page renders.
 */

const page = z.coerce.number().int().min(1).catch(1);
const text = (max: number) => z.string().trim().max(max).catch('');

/** Public blog list and search: `/blog?page=2`, `/search?q=…&tag=…&sort=…`. */
export const POST_SORTS = ['newest', 'oldest', 'title'] as const;
export type PostSort = (typeof POST_SORTS)[number];

export const postQuerySchema = z.object({
	q: text(100),
	tag: text(40),
	sort: z.enum(POST_SORTS).catch('newest'),
	page
});
export type PostQuery = z.infer<typeof postQuerySchema>;

/** Dashboard table: `/dashboard/items?page=…&sort=…&dir=…&status=…`. */
export const ITEM_SORT_KEYS = [
	'name',
	'status',
	'channel',
	'owner',
	'budget',
	'spent',
	'ctr',
	'updatedAt'
] as const;
export type ItemSortKey = (typeof ITEM_SORT_KEYS)[number];

export const PER_PAGE_OPTIONS = [10, 25, 50] as const;
export type PerPage = (typeof PER_PAGE_OPTIONS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const itemsQuerySchema = z.object({
	page,
	perPage: z.coerce
		.number()
		.refine((n): n is PerPage => (PER_PAGE_OPTIONS as readonly number[]).includes(n))
		.catch(PER_PAGE_OPTIONS[0]),
	sort: z.enum(ITEM_SORT_KEYS).catch('updatedAt'),
	dir: z.enum(SORT_DIRECTIONS).catch('desc'),
	q: text(100),
	/** `''` means "any". */
	status: z.enum([...ITEM_STATUSES, '']).catch(''),
	channel: z.enum([...ITEM_CHANNELS, '']).catch(''),
	/** An owner id; unknown ids simply match no row. */
	owner: text(60)
});
export type ItemsQuery = z.infer<typeof itemsQuerySchema>;
