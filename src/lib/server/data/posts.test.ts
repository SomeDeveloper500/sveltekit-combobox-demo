import { describe, expect, it } from 'vitest';
import postsJson from '../../../../mocks/posts.json';
import tagsJson from '../../../../mocks/tags.json';
import { postQuerySchema } from '#lib/schemas/query.js';
import { createPostRepository } from './posts';
import { DataValidationError } from './validate';

const author = { id: 'u_a', name: 'Ada', avatarColor: '#112233' };

type Spec = {
	slug: string;
	en: string;
	de?: string;
	body?: string;
	deBody?: string;
	tags?: string[];
	publishedAt?: string;
};

function post(spec: Spec) {
	return {
		id: `post_${spec.slug}`,
		slug: spec.slug,
		translations: {
			en: { title: spec.en, excerpt: `About ${spec.en}`, body: spec.body ?? `Body of ${spec.en}` },
			de: {
				title: spec.de ?? spec.en,
				excerpt: `Über ${spec.de ?? spec.en}`,
				body: spec.deBody ?? `Text zu ${spec.de ?? spec.en}`
			}
		},
		tags: spec.tags ?? [],
		author,
		publishedAt: spec.publishedAt ?? '2026-05-01T00:00:00Z',
		readingTimeMinutes: 3,
		coverColor: '#1e293b'
	};
}

const tags = [
	{ slug: 'design', label: { en: 'Design', de: 'Gestaltung' } },
	{ slug: 'perf', label: { en: 'Performance', de: 'Leistung' } }
];

const specs: Spec[] = [
	{ slug: 'a', en: 'Alpha post', tags: ['design'], publishedAt: '2026-05-01T00:00:00Z' },
	{ slug: 'b', en: 'Beta post', tags: ['perf'], publishedAt: '2026-05-03T00:00:00Z' },
	{
		slug: 'c',
		en: 'Gamma post',
		de: 'Ärger mit Gamma',
		body: 'We love a good café.',
		deBody: 'Ein Wort nur auf Deutsch: Schnellstart.',
		tags: ['design', 'perf'],
		publishedAt: '2026-05-02T00:00:00Z'
	},
	{ slug: 'd', en: 'Delta post', publishedAt: '2026-05-03T00:00:00Z' },
	{ slug: 'e', en: 'Epsilon post', tags: ['perf'], publishedAt: '2026-04-01T00:00:00Z' }
];

const repo = createPostRepository(specs.map(post), tags);
const parse = (query: Record<string, unknown> = {}) => postQuerySchema.parse(query);
const slugs = (result: { posts: { slug: string }[] }) => result.posts.map((p) => p.slug);

describe('postRepository.query: filtering', () => {
	it('returns everything for an empty query', () => {
		expect(repo.query(parse(), 'en').total).toBe(5);
	});

	it('filters by tag', () => {
		expect(slugs(repo.query(parse({ tag: 'design', sort: 'oldest' }), 'en'))).toEqual(['a', 'c']);
	});

	it('returns nothing for a tag no post has', () => {
		expect(repo.query(parse({ tag: 'ghost' }), 'en').total).toBe(0);
	});

	it('searches titles, excerpts and bodies', () => {
		expect(slugs(repo.query(parse({ q: 'epsilon' }), 'en'))).toEqual(['e']);
		expect(slugs(repo.query(parse({ q: 'good caf' }), 'en'))).toEqual(['c']);
	});

	it('ignores case and accents', () => {
		expect(slugs(repo.query(parse({ q: 'CAFE' }), 'en'))).toEqual(['c']);
	});

	it('searches the text of the requested locale only', () => {
		expect(slugs(repo.query(parse({ q: 'schnellstart' }), 'de'))).toEqual(['c']);
		expect(repo.query(parse({ q: 'schnellstart' }), 'en').total).toBe(0);
	});

	it('combines a tag and a search', () => {
		expect(slugs(repo.query(parse({ tag: 'perf', q: 'post' }), 'en')).sort()).toEqual([
			'b',
			'c',
			'e'
		]);
		expect(slugs(repo.query(parse({ tag: 'design', q: 'beta' }), 'en'))).toEqual([]);
	});
});

describe('postRepository.query: sorting', () => {
	it('puts the newest first by default and breaks date ties by slug', () => {
		expect(slugs(repo.query(parse(), 'en'))).toEqual(['b', 'd', 'c', 'a', 'e']);
	});

	it('can put the oldest first', () => {
		expect(slugs(repo.query(parse({ sort: 'oldest' }), 'en'))).toEqual(['e', 'a', 'c', 'b', 'd']);
	});

	it('sorts by title using the locale collation', () => {
		expect(slugs(repo.query(parse({ sort: 'title' }), 'en'))).toEqual(['a', 'b', 'd', 'e', 'c']);
		// German "Ärger" sorts with the As, between "Alpha" and "Beta" (code-point order would put
		// it after every plain letter).
		expect(slugs(repo.query(parse({ sort: 'title' }), 'de'))).toEqual(['a', 'c', 'b', 'd', 'e']);
	});
});

describe('postRepository.query: pagination', () => {
	it('slices by page size and reports the totals', () => {
		const first = repo.query(parse({ page: 1 }), 'en', 2);
		expect(first).toMatchObject({ total: 5, pages: 3, page: 1, pageSize: 2 });
		expect(first.posts).toHaveLength(2);
		const last = repo.query(parse({ page: 3 }), 'en', 2);
		expect(last.posts).toHaveLength(1);
	});

	it('never repeats or drops a post across pages', () => {
		const seen = [1, 2, 3].flatMap((page) => slugs(repo.query(parse({ page }), 'en', 2)));
		expect(seen.sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
	});

	it('clamps a page past the end to the last page', () => {
		const result = repo.query(parse({ page: 99 }), 'en', 2);
		expect(result.page).toBe(3);
		expect(result.posts).toHaveLength(1);
	});

	it('reports one empty page when nothing matches', () => {
		expect(repo.query(parse({ q: 'zzz' }), 'en')).toMatchObject({
			total: 0,
			pages: 1,
			page: 1,
			posts: []
		});
	});
});

describe('postRepository.query: what a list item contains', () => {
	it('is a summary in the locale, without the body', () => {
		const [first] = repo.query(parse({ q: 'ärger' }), 'de').posts;
		expect(first.title).toBe('Ärger mit Gamma');
		expect(first).not.toHaveProperty('paragraphs');
		expect(first).not.toHaveProperty('body');
	});
});

describe('postRepository.get', () => {
	it('returns the post in the requested locale, split into paragraphs', () => {
		const multi = createPostRepository(
			[post({ slug: 'm', en: 'Multi', body: 'One.\n\nTwo.\n\n\n\nThree.\n\n' })],
			tags
		);
		expect(multi.get('m', 'en')?.paragraphs).toEqual(['One.', 'Two.', 'Three.']);
		expect(repo.get('c', 'de')?.title).toBe('Ärger mit Gamma');
	});

	it('returns undefined for an unknown slug', () => {
		expect(repo.get('nope', 'en')).toBeUndefined();
	});

	it('lists tags and slugs', () => {
		expect(repo.listSlugs()).toEqual(['a', 'b', 'c', 'd', 'e']);
		expect(repo.listTags().map((tag) => tag.slug)).toEqual(['design', 'perf']);
	});
});

describe('postRepository: bad data stops the boot with a clear error', () => {
	const build =
		(list: unknown[], tagList: unknown = tags) =>
		() =>
			createPostRepository(list, tagList);

	it('rejects a post that uses a tag outside the taxonomy', () => {
		const run = build([post({ slug: 'x', en: 'X', tags: ['unknown'] })]);
		expect(run).toThrow(DataValidationError);
		expect(run).toThrow(/x uses unknown tag "unknown"/);
	});

	it('rejects duplicate slugs', () => {
		expect(
			build([post({ slug: 'x', en: 'X' }), { ...post({ slug: 'y', en: 'Y' }), slug: 'x' }])
		).toThrow(/duplicate slug: "x"/);
	});

	it('rejects a post that misses a translation', () => {
		const broken = post({ slug: 'x', en: 'X' }) as Record<string, unknown>;
		broken.translations = { en: (broken.translations as Record<string, unknown>).en };
		expect(build([broken])).toThrow(/mocks\/posts\.json/);
	});

	it('rejects posts that are not an array', () => {
		expect(build({ not: 'an array' } as unknown as unknown[])).toThrow(/expected an array/);
	});
});

describe('the shipped mocks', () => {
	const real = createPostRepository(postsJson, tagsJson);

	it('load, and page into the expected number of pages', () => {
		const result = real.query(parse(), 'en');
		expect(result.total).toBe(20);
		expect(result.pages).toBe(4);
		expect(result.posts).toHaveLength(6);
	});

	it('have both locales for every post', () => {
		for (const slug of real.listSlugs()) {
			expect(real.get(slug, 'en')?.title).toBeTruthy();
			expect(real.get(slug, 'de')?.title).toBeTruthy();
		}
	});
});
