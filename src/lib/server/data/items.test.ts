import { describe, expect, it } from 'vitest';
import itemsJson from '../../../../mocks/items.json';
import { itemsQuerySchema } from '#lib/schemas/query.js';
import { createItemRepository } from './items';
import { DataValidationError } from './validate';

const owners = {
	anna: { id: 'u_anna', name: 'Anna Becker' },
	marek: { id: 'u_marek', name: 'Marek Dvořák' },
	omar: { id: 'u_omar', name: 'Omar Haddad' }
};

type Spec = Partial<{
	name: string;
	status: string;
	channel: string;
	owner: { id: string; name: string };
	budget: number;
	spent: number;
	ctr: number;
	updatedAt: string;
}>;

function item(n: number, spec: Spec = {}) {
	return {
		id: `cmp_${String(n).padStart(3, '0')}`,
		name: spec.name ?? `Campaign #${n}`,
		status: spec.status ?? 'active',
		channel: spec.channel ?? 'email',
		owner: spec.owner ?? owners.anna,
		budget: spec.budget ?? 1000,
		spent: spec.spent ?? 100,
		impressions: 1000,
		clicks: 10,
		ctr: spec.ctr ?? 0.01,
		startDate: '2026-01-01',
		endDate: '2026-12-31',
		updatedAt: spec.updatedAt ?? '2026-04-01T00:00:00Z',
		tags: []
	};
}

const specs: Spec[] = [
	{ name: 'Café launch', status: 'draft', channel: 'email', owner: owners.anna, budget: 500 },
	{ name: 'Item #10', status: 'active', channel: 'sms', owner: owners.marek, budget: 3000 },
	{ name: 'Item #2', status: 'scheduled', channel: 'web', owner: owners.omar, budget: 1500 },
	{ name: 'Spring push', status: 'paused', channel: 'push', owner: owners.anna, budget: 1500 },
	{
		name: 'Winter social',
		status: 'archived',
		channel: 'social',
		owner: owners.marek,
		budget: 800
	},
	{ name: 'Black friday', status: 'completed', channel: 'email', owner: owners.omar, budget: 2000 }
];
const rows = specs.map((spec, index) => item(index + 1, spec));
const idsOf = (page: { rows: { id: string }[] }) => page.rows.map((row) => row.id);
const parse = (query: Record<string, unknown> = {}) =>
	itemsQuerySchema.parse({ perPage: '50', ...query });

describe('itemRepository.query: filtering', () => {
	const repo = createItemRepository(rows);

	it('returns everything for an empty query', () => {
		expect(repo.query(parse()).total).toBe(6);
	});

	it('filters by status, channel and owner id', () => {
		expect(repo.query(parse({ status: 'paused' })).rows.map((row) => row.name)).toEqual([
			'Spring push'
		]);
		expect(repo.query(parse({ channel: 'email' })).total).toBe(2);
		expect(repo.query(parse({ owner: 'u_marek' })).total).toBe(2);
	});

	it('combines the facets', () => {
		expect(
			repo.query(parse({ channel: 'email', owner: 'u_omar' })).rows.map((row) => row.name)
		).toEqual(['Black friday']);
		expect(repo.query(parse({ channel: 'email', status: 'paused' })).total).toBe(0);
	});

	it('searches the name, ignoring case and accents', () => {
		expect(repo.query(parse({ q: 'CAFE' })).rows.map((row) => row.name)).toEqual(['Café launch']);
		expect(repo.query(parse({ q: 'spring' })).total).toBe(1);
	});

	it('combines a search with a facet', () => {
		expect(repo.query(parse({ q: 'item', status: 'active' })).total).toBe(1);
		expect(repo.query(parse({ q: 'item', status: 'draft' })).total).toBe(0);
	});

	it('matches nothing for an owner that does not exist', () => {
		expect(repo.query(parse({ owner: 'u_ghost' })).total).toBe(0);
	});
});

describe('itemRepository.query: sorting', () => {
	const repo = createItemRepository(rows);
	const names = (query: Record<string, unknown>) =>
		repo.query(parse(query)).rows.map((row) => row.name);

	it('sorts the newest update first by default', () => {
		const dated = createItemRepository([
			item(1, { updatedAt: '2026-04-01T00:00:00Z' }),
			item(2, { updatedAt: '2026-04-03T00:00:00Z' }),
			item(3, { updatedAt: '2026-04-02T00:00:00Z' })
		]);
		expect(idsOf(dated.query(parse()))).toEqual(['cmp_002', 'cmp_003', 'cmp_001']);
	});

	it('compares names numerically: "#2" comes before "#10"', () => {
		const result = names({ sort: 'name', dir: 'asc' });
		expect(result.indexOf('Item #2')).toBeLessThan(result.indexOf('Item #10'));
	});

	it('sorts a text column in both directions', () => {
		expect(names({ sort: 'name', dir: 'asc' })[0]).toBe('Black friday');
		expect(names({ sort: 'name', dir: 'desc' })[0]).toBe('Winter social');
	});

	it('sorts status by lifecycle, not alphabetically', () => {
		expect(repo.query(parse({ sort: 'status', dir: 'asc' })).rows.map((row) => row.status)).toEqual(
			['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']
		);
	});

	it('sorts owners by name and numbers by value', () => {
		expect(
			repo.query(parse({ sort: 'owner', dir: 'asc' })).rows.map((row) => row.owner.name)[0]
		).toBe('Anna Becker');
		expect(repo.query(parse({ sort: 'budget', dir: 'desc' })).rows[0].budget).toBe(3000);
		expect(repo.query(parse({ sort: 'budget', dir: 'asc' })).rows[0].budget).toBe(500);
	});

	it('sorts by spent, ctr and channel too', () => {
		const wide = createItemRepository([
			item(1, { channel: 'web', ctr: 0.03 }),
			item(2, { channel: 'email', ctr: 0.01 }),
			item(3, { channel: 'sms', ctr: 0.02 })
		]);
		expect(idsOf(wide.query(parse({ sort: 'ctr', dir: 'asc' })))).toEqual([
			'cmp_002',
			'cmp_003',
			'cmp_001'
		]);
		expect(idsOf(wide.query(parse({ sort: 'channel', dir: 'asc' })))).toEqual([
			'cmp_002',
			'cmp_003',
			'cmp_001'
		]);
	});

	it('breaks ties by id, ascending in either direction, so the order is stable', () => {
		const tied = createItemRepository([item(3), item(1), item(2)]); // all the same budget
		expect(idsOf(tied.query(parse({ sort: 'budget', dir: 'asc' })))).toEqual([
			'cmp_001',
			'cmp_002',
			'cmp_003'
		]);
		expect(idsOf(tied.query(parse({ sort: 'budget', dir: 'desc' })))).toEqual([
			'cmp_001',
			'cmp_002',
			'cmp_003'
		]);
	});
});

describe('itemRepository.query: pagination', () => {
	const many = createItemRepository(Array.from({ length: 25 }, (_, index) => item(index + 1)));
	const page = (query: Record<string, unknown>) =>
		many.query(itemsQuerySchema.parse({ sort: 'name', dir: 'asc', ...query }));

	it('slices by page size and reports the totals', () => {
		expect(page({ page: 1, perPage: 10 })).toMatchObject({
			total: 25,
			pages: 3,
			page: 1,
			perPage: 10
		});
		expect(page({ page: 1, perPage: 10 }).rows).toHaveLength(10);
		expect(page({ page: 3, perPage: 10 }).rows).toHaveLength(5);
	});

	it('never repeats or drops a row across pages', () => {
		const all = [1, 2, 3].flatMap((n) => idsOf(page({ page: n, perPage: 10 })));
		expect(new Set(all).size).toBe(25);
	});

	it('honors the page size options', () => {
		expect(page({ perPage: 25 }).pages).toBe(1);
		expect(page({ perPage: 50 }).rows).toHaveLength(25);
	});

	it('clamps a page past the end to the last page', () => {
		const result = page({ page: 40, perPage: 10 });
		expect(result.page).toBe(3);
		expect(result.rows).toHaveLength(5);
	});

	it('reports one empty page when nothing matches', () => {
		expect(page({ q: 'zzz' })).toMatchObject({ total: 0, pages: 1, page: 1, rows: [] });
	});
});

describe('itemRepository: lookups and writes', () => {
	it('lists distinct owners by name', () => {
		const repo = createItemRepository(rows);
		expect(repo.listOwners()).toEqual([owners.anna, owners.marek, owners.omar]);
	});

	it('finds an item by id', () => {
		const repo = createItemRepository(rows);
		expect(repo.get('cmp_002')?.name).toBe('Item #10');
		expect(repo.get('cmp_999')).toBeUndefined();
	});

	it('keeps repositories independent from one another', () => {
		const first = createItemRepository(rows);
		const second = createItemRepository(rows);
		first.updateStatus('cmp_001', 'scheduled', { role: 'admin' });
		expect(second.get('cmp_001')?.status).toBe('draft');
	});
});

describe('itemRepository.updateStatus', () => {
	const admin = { role: 'admin' } as const;
	const clock = (iso: string) => () => new Date(iso);
	const build = (iso = '2026-06-01T12:00:00.789Z') =>
		createItemRepository(rows, { now: clock(iso) });

	it('moves a row along the lifecycle and stamps the time, without milliseconds', () => {
		const repo = build();
		const result = repo.updateStatus('cmp_001', 'scheduled', admin); // draft → scheduled
		expect(result).toMatchObject({ ok: true, changed: true });
		expect(repo.get('cmp_001')).toMatchObject({
			status: 'scheduled',
			updatedAt: '2026-06-01T12:00:00Z'
		});
	});

	it('is visible to later queries and puts the edited row first when sorting by recency', () => {
		const repo = build();
		repo.updateStatus('cmp_001', 'scheduled', admin);
		expect(repo.query(parse({ status: 'draft' })).total).toBe(0);
		expect(repo.query(parse({ status: 'scheduled' })).total).toBe(2);
		expect(repo.query(parse({ sort: 'updatedAt', dir: 'desc' })).rows[0].id).toBe('cmp_001');
	});

	it('leaves a page that was already returned untouched', () => {
		const repo = build();
		const before = repo.query(parse({ status: 'draft' }));
		repo.updateStatus('cmp_001', 'scheduled', admin);
		expect(before.rows[0].status).toBe('draft');
	});

	it('lets an editor write, and refuses a viewer', () => {
		expect(build().updateStatus('cmp_001', 'scheduled', { role: 'editor' })).toMatchObject({
			ok: true
		});
		expect(build().updateStatus('cmp_001', 'scheduled', { role: 'viewer' })).toEqual({
			ok: false,
			code: 'forbidden'
		});
	});

	it('answers an anonymous caller with "unauthenticated", not "forbidden"', () => {
		expect(build().updateStatus('cmp_001', 'scheduled', null)).toEqual({
			ok: false,
			code: 'unauthenticated'
		});
		expect(build().updateStatus('cmp_001', 'scheduled', undefined)).toMatchObject({
			code: 'unauthenticated'
		});
	});

	it('does not change anything for a refused caller', () => {
		const repo = build();
		repo.updateStatus('cmp_001', 'scheduled', { role: 'viewer' });
		repo.updateStatus('cmp_001', 'scheduled', null);
		expect(repo.get('cmp_001')).toMatchObject({
			status: 'draft',
			updatedAt: '2026-04-01T00:00:00Z'
		});
	});

	it('refuses a move the lifecycle does not allow and says which one', () => {
		const repo = build();
		const result = repo.updateStatus('cmp_001', 'active', admin); // draft → active skips scheduled
		expect(result).toEqual({ ok: false, code: 'bad_transition', from: 'draft', to: 'active' });
		expect(repo.get('cmp_001')?.status).toBe('draft');
	});

	it('refuses to leave archived', () => {
		const repo = build();
		expect(repo.updateStatus('cmp_005', 'active', admin)).toMatchObject({
			code: 'bad_transition',
			from: 'archived'
		}); // cmp_005 is archived
	});

	it('reports an unknown id', () => {
		expect(build().updateStatus('cmp_999', 'active', admin)).toEqual({
			ok: false,
			code: 'not_found'
		});
	});

	it('checks who you are before whether the row exists, so ids cannot be probed', () => {
		expect(build().updateStatus('cmp_999', 'active', { role: 'viewer' })).toMatchObject({
			code: 'forbidden'
		});
		expect(build().updateStatus('cmp_999', 'active', null)).toMatchObject({
			code: 'unauthenticated'
		});
	});

	it('treats a repeated request as a success that changes nothing', () => {
		let time = '2026-06-01T12:00:00Z';
		const repo = createItemRepository(rows, { now: () => new Date(time) });
		repo.updateStatus('cmp_001', 'scheduled', admin);
		const stamped = repo.get('cmp_001')?.updatedAt;

		time = '2026-06-02T09:00:00Z';
		const repeat = repo.updateStatus('cmp_001', 'scheduled', admin);
		expect(repeat).toMatchObject({ ok: true, changed: false });
		expect(repo.get('cmp_001')?.updatedAt).toBe(stamped);
	});

	it('keeps order consistent with string comparison when data has no milliseconds', () => {
		const repo = build('2026-04-01T00:00:00.500Z'); // same second as the seed rows
		repo.updateStatus('cmp_001', 'scheduled', admin);
		const stamped = repo.get('cmp_001')!.updatedAt;
		expect(stamped).toBe('2026-04-01T00:00:00Z');
		expect(stamped.length).toBe(rows[0].updatedAt.length);
	});
});

describe('itemRepository: bad data stops the boot with a clear error', () => {
	it('rejects a row with an unknown status and names the field', () => {
		const run = () => createItemRepository([item(1), item(2, { status: 'deleted' })]);
		expect(run).toThrow(DataValidationError);
		expect(run).toThrow(/mocks\/items\.json/);
		expect(run).toThrow(/\[1\]\.status/);
	});

	it('rejects duplicate ids', () => {
		expect(() => createItemRepository([item(1), item(1)])).toThrow(/duplicate id: "cmp_001"/);
	});

	it('rejects data that is not an array', () => {
		expect(() => createItemRepository({ items: [] })).toThrow(/expected an array/);
	});
});

describe('the shipped mocks', () => {
	const real = createItemRepository(itemsJson);

	it('load, and page like an API', () => {
		const result = real.query(itemsQuerySchema.parse({}));
		expect(result).toMatchObject({ total: 220, pages: 22, page: 1, perPage: 10 });
		expect(result.rows).toHaveLength(10);
	});

	it('are ordered by the newest update by default', () => {
		const { rows: first } = real.query(itemsQuerySchema.parse({}));
		const dates = first.map((row) => row.updatedAt);
		expect(dates).toEqual([...dates].sort().reverse());
	});

	it('have the owners the filter offers, and each filters to a non-empty set', () => {
		for (const owner of real.listOwners()) {
			expect(real.query(itemsQuerySchema.parse({ owner: owner.id })).total).toBeGreaterThan(0);
		}
	});

	it('add up: the facets partition the table', () => {
		const total = (['draft', 'scheduled', 'active', 'paused', 'completed', 'archived'] as const)
			.map((status) => real.query(itemsQuerySchema.parse({ status })).total)
			.reduce((sum, count) => sum + count, 0);
		expect(total).toBe(220);
	});
});
