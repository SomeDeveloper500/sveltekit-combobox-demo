import { LOCALES, type Locale } from '#lib/schemas/common.js';
import { postSchema, tagSchema, type Post, type Tag } from '#lib/schemas/post.js';
import type { PostQuery } from '#lib/schemas/query.js';
import { normalize } from '#lib/text.js';
import postsJson from '../../../../mocks/posts.json';
import tagsJson from '../../../../mocks/tags.json';
import { DataValidationError, parseCollection } from './validate';

export const BLOG_PAGE_SIZE = 6;

export type PostSummary = {
	slug: string;
	title: string;
	excerpt: string;
	tags: string[];
	author: Post['author'];
	publishedAt: string;
	readingTimeMinutes: number;
	coverColor: string;
};

export type PostContent = PostSummary & { paragraphs: string[] };

export type PostsPage = {
	total: number;
	pages: number;
	/** The page actually returned: a requested page past the end is clamped to the last one. */
	page: number;
	pageSize: number;
	posts: PostSummary[];
};

/**
 * Read-only access to posts and tags, behind a function so tests can feed it other data. The
 * data is validated here, once, when the repository is built: a bad file stops the server from
 * starting instead of failing a user's request later.
 */
export function createPostRepository(rawPosts: unknown, rawTags: unknown) {
	const posts = parseCollection('mocks/posts.json', postSchema, rawPosts, {
		id: (post) => post.id,
		slug: (post) => post.slug
	});
	const tags = parseCollection('mocks/tags.json', tagSchema, rawTags, { slug: (tag) => tag.slug });

	const known = new Set(tags.map((tag) => tag.slug));
	const unknownTags = posts.flatMap((post) =>
		post.tags
			.filter((slug) => !known.has(slug))
			.map((slug) => `${post.slug} uses unknown tag "${slug}"`)
	);
	if (unknownTags.length > 0) throw new DataValidationError('mocks/posts.json', unknownTags);

	// What the search matches against, normalized once per post and locale.
	const haystacks = new Map<string, Record<Locale, string>>(
		posts.map((post) => {
			const byLocale = {} as Record<Locale, string>;
			for (const locale of LOCALES) {
				const t = post.translations[locale];
				byLocale[locale] = normalize(`${t.title} ${t.excerpt} ${t.body}`);
			}
			return [post.slug, byLocale];
		})
	);

	function summarize(post: Post, locale: Locale): PostSummary {
		const t = post.translations[locale];
		return {
			slug: post.slug,
			title: t.title,
			excerpt: t.excerpt,
			tags: post.tags,
			author: post.author,
			publishedAt: post.publishedAt,
			readingTimeMinutes: post.readingTimeMinutes,
			coverColor: post.coverColor
		};
	}

	return {
		listTags: (): readonly Tag[] => tags,
		listSlugs: (): string[] => posts.map((post) => post.slug),

		get(slug: string, locale: Locale): PostContent | undefined {
			const post = posts.find((candidate) => candidate.slug === slug);
			if (!post) return undefined;
			const paragraphs = post.translations[locale].body.split(/\n{2,}/).filter(Boolean);
			return { ...summarize(post, locale), paragraphs };
		},

		query(query: PostQuery, locale: Locale, pageSize = BLOG_PAGE_SIZE): PostsPage {
			const needle = normalize(query.q);
			const matching = posts.filter(
				(post) =>
					(!query.tag || post.tags.includes(query.tag)) &&
					(!needle || haystacks.get(post.slug)![locale].includes(needle))
			);

			const byDate = (a: Post, b: Post) =>
				a.publishedAt < b.publishedAt ? -1 : a.publishedAt > b.publishedAt ? 1 : 0;
			const collator = new Intl.Collator(locale);
			matching.sort((a, b) => {
				const order =
					query.sort === 'oldest'
						? byDate(a, b)
						: query.sort === 'title'
							? collator.compare(a.translations[locale].title, b.translations[locale].title)
							: byDate(b, a);
				return order || a.slug.localeCompare(b.slug);
			});

			const total = matching.length;
			const pages = Math.max(1, Math.ceil(total / pageSize));
			const page = Math.min(query.page, pages);
			const start = (page - 1) * pageSize;
			return {
				total,
				pages,
				page,
				pageSize,
				posts: matching.slice(start, start + pageSize).map((post) => summarize(post, locale))
			};
		}
	};
}

export type PostRepository = ReturnType<typeof createPostRepository>;

/** The app's repository, built from the shipped mocks as soon as this module is first imported. */
export const postRepository = createPostRepository(postsJson, tagsJson);
