import { settle } from '#lib/api/settle.js';
import { itemsQueryCodec } from '#lib/query/codecs.js';
import { itemRepository } from '#lib/server/data/items.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ITEMS_LIST } from './keys';

const report = (what: string) => (cause: unknown) => console.error(`[items] ${what} failed`, cause);

export const load: PageServerLoad = async ({ url, isDataRequest, depends }) => {
	// A status change elsewhere on the page refreshes this load by name, not the whole tree.
	depends(ITEMS_LIST);

	const query = itemsQueryCodec.decode(url.searchParams);

	// The URL is the state, so it has one spelling: defaults dropped, stray parameters removed.
	// A page past the end is not redirected: the page count is only known once the (streamed)
	// result arrives, and the result reports the page it actually returned.
	const wanted = itemsQueryCodec.encode(query).toString();
	if (wanted !== url.searchParams.toString()) {
		redirect(308, `${url.pathname}${wanted ? `?${wanted}` : ''}`);
	}

	// Each part settles on its own, so one failing does not take the page down: the table can
	// fail while the filters work, and the owner filter can fail while the table works.
	const result = settle(
		Promise.resolve().then(() => itemRepository.query(query)),
		report('list')
	);
	const owners = settle(
		Promise.resolve().then(() => itemRepository.listOwners()),
		report('owners')
	);

	// A promise is delivered by a script, so a document request with no JavaScript would be left
	// with the placeholder. Documents therefore wait for the data; only client-side navigations,
	// which have JavaScript by definition, get the promise and show a skeleton meanwhile.
	return {
		query,
		owners: await owners,
		result: isDataRequest ? result : await result
	};
};
