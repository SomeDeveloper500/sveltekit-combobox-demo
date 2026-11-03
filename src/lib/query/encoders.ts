import type { ItemsQuery, PostQuery } from '#lib/schemas/query.js';
import { createQueryEncoder } from './encoder.js';

// The encoders the pages build their links with. Their defaults repeat what the schemas in
// `schemas/query.ts` fall back to (a test holds the two together), so that a page does not import
// the schemas, and the validation library behind them, only to know a default. Field order is the
// order the URL lists them in.

/** `/dashboard/items?page=…&sort=…&status=…` */
export const itemsQueryEncoder = createQueryEncoder<ItemsQuery>({
	page: 1,
	perPage: 10,
	sort: 'updatedAt',
	dir: 'desc',
	q: '',
	status: '',
	channel: '',
	owner: ''
});

/** `/search?q=…&tag=…&sort=…` */
export const postQueryEncoder = createQueryEncoder<PostQuery>({
	q: '',
	tag: '',
	sort: 'newest',
	page: 1
});

/** `/blog?page=…` */
export const blogQueryEncoder = createQueryEncoder<Pick<PostQuery, 'page'>>({ page: 1 });
