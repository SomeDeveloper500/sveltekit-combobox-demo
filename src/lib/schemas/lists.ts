// The fixed lists of values the pages offer and the schemas accept. They import nothing, on
// purpose: a page that only needs to show the options (a filter, a sort menu) imports this file,
// and must not pull the validation library into the JavaScript every visitor downloads. The
// schemas in `item.ts` and `query.ts` are built from these same lists and re-export them.

export const ITEM_STATUSES = [
	'draft',
	'scheduled',
	'active',
	'paused',
	'completed',
	'archived'
] as const;
export const ITEM_CHANNELS = ['email', 'sms', 'web', 'social', 'push'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ItemChannel = (typeof ITEM_CHANNELS)[number];

export const POST_SORTS = ['newest', 'oldest', 'title'] as const;
export type PostSort = (typeof POST_SORTS)[number];

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
