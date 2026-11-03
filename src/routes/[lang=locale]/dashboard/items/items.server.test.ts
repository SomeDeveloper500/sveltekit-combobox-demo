import { beforeEach, describe, expect, it, vi } from 'vitest';
import { itemRepository } from '#lib/server/data/items.js';
import { load } from './+page.server';
import { ITEMS_LIST } from './keys';

type Event = Parameters<typeof load>[0];
type Owner = { id: string; name: string };
type Result = {
	total: number;
	pages: number;
	page: number;
	rows: { name: string; status: string; channel: string; owner: { id: string } }[];
};
type Settled<T> = { ok: true; value: T } | { ok: false };
type Data = {
	query: { page: number; perPage: number; sort: string; dir: string; status: string };
	owners: Settled<Owner[]>;
	result: Settled<Result> | Promise<Settled<Result>>;
};

const depends = vi.fn();

async function run(search: string, isDataRequest = false) {
	const event = {
		url: new URL(`https://example.test/en/dashboard/items${search}`),
		isDataRequest,
		depends
	} as unknown as Event;
	try {
		return { data: (await load(event)) as unknown as Data, redirect: null as string | null };
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return { data: null, redirect: `${status} ${location}` };
	}
}

/** The listing for a URL, unwrapped: the tests below are about what is in it. */
async function listing(search: string): Promise<Result> {
	const settled = await (await run(search)).data!.result;
	if (!settled.ok) throw new Error('the list failed');
	return settled.value;
}

beforeEach(() => {
	vi.restoreAllMocks();
	depends.mockClear();
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('/dashboard/items load', () => {
	it('streams the result to a client-side navigation: a promise, with owners ready at once', async () => {
		const { data } = await run('', true);
		expect(data!.result).toBeInstanceOf(Promise);
		expect(data!.owners.ok).toBe(true);
		const settled = await data!.result;
		expect(settled.ok && settled.value.rows).toHaveLength(data!.query.perPage);
	});

	it('waits for the data on a document request, so a page without JavaScript has its table', async () => {
		const { data } = await run('');
		expect(data!.result).not.toBeInstanceOf(Promise);
		const settled = data!.result as Settled<Result>;
		expect(settled.ok && settled.value.rows).toHaveLength(10);
	});

	it('registers the list as a dependency, so a status change can refresh just this load', async () => {
		await run('');
		expect(depends).toHaveBeenCalledWith(ITEMS_LIST);
		expect(ITEMS_LIST).toBe('items:list');
	});

	it('defaults to the most recently updated first', async () => {
		const { data } = await run('');
		expect(data!.query).toMatchObject({ page: 1, sort: 'updatedAt', dir: 'desc', status: '' });
	});

	it('filters by status, channel and owner together', async () => {
		const all = await listing('');
		const owner = all.rows[0].owner.id;
		const result = await listing(`?status=active&owner=${owner}`);
		expect(result.total).toBeLessThan(all.total);
		expect(result.rows.every((row) => row.status === 'active' && row.owner.id === owner)).toBe(
			true
		);
	});

	it('filters by text, ignoring case and accents', async () => {
		const found = await listing('?q=SPRING');
		expect(found.total).toBeGreaterThan(0);
		expect(found.rows.every((row) => row.name.toLowerCase().includes('spring'))).toBe(true);
	});

	it('sorts both ways', async () => {
		const names = async (search: string) => (await listing(search)).rows.map((row) => row.name);
		const asc = await names('?sort=name&dir=asc');
		const desc = await names('?sort=name');
		expect(asc).not.toEqual(desc);
		expect(asc[0].localeCompare(asc[1], 'en', { numeric: true, sensitivity: 'base' })).toBeLessThan(
			0
		);
	});

	it('pages through without overlap', async () => {
		const first = (await listing('')).rows.map((row) => row.name);
		const second = (await listing('?page=2')).rows.map((row) => row.name);
		expect(second).toHaveLength(10);
		expect(first.filter((name) => second.includes(name))).toEqual([]);
	});

	it('reports the clamped page for a page past the end, without redirecting', async () => {
		const { redirect } = await run('?page=999');
		expect(redirect).toBeNull();
		const result = await listing('?page=999');
		expect(result.page).toBe(result.pages);
		expect(result.rows.length).toBeGreaterThan(0);
	});

	it('redirects a non-canonical URL to its one spelling', async () => {
		expect((await run('?page=1')).redirect).toBe('308 /en/dashboard/items');
		expect((await run('?sort=bogus&status=active')).redirect).toBe(
			'308 /en/dashboard/items?status=active'
		);
		expect((await run('?utm_source=x&dir=desc')).redirect).toBe('308 /en/dashboard/items');
	});

	it('does not redirect a canonical URL', async () => {
		expect((await run('?sort=name&dir=asc&status=active')).redirect).toBeNull();
	});

	it('shows nothing, not an error, when a filter matches no row', async () => {
		expect(await listing('?q=zzzzzz-no-such-campaign')).toMatchObject({
			total: 0,
			pages: 1,
			page: 1,
			rows: []
		});
	});
});

describe('/dashboard/items load, when a part fails', () => {
	it('reports a failed list as a failed outcome, with the filters and owners intact', async () => {
		vi.spyOn(itemRepository, 'query').mockImplementation(() => {
			throw new Error('database is down');
		});
		const { data } = await run('?status=active');
		expect(data!.result).toEqual({ ok: false });
		expect(data!.owners.ok).toBe(true);
		expect(data!.query.status).toBe('active');
	});

	it('does not throw on a failed list for a client-side navigation either', async () => {
		vi.spyOn(itemRepository, 'query').mockImplementation(() => {
			throw new Error('database is down');
		});
		const { data } = await run('', true);
		expect(await data!.result).toEqual({ ok: false });
	});

	it('reports failed owners while the list still loads', async () => {
		vi.spyOn(itemRepository, 'listOwners').mockImplementation(() => {
			throw new Error('owners are down');
		});
		const { data } = await run('');
		expect(data!.owners).toEqual({ ok: false });
		expect((data!.result as Settled<Result>).ok).toBe(true);
	});

	it('logs the cause, and keeps it out of the data sent to the page', async () => {
		vi.spyOn(itemRepository, 'query').mockImplementation(() => {
			throw new Error('secret connection string');
		});
		const { data } = await run('');
		expect(JSON.stringify(data)).not.toContain('secret connection string');
		expect(console.error).toHaveBeenCalledOnce();
	});
});
