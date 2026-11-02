import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import items from '../../../mocks/items.json';
import posts from '../../../mocks/posts.json';
import tags from '../../../mocks/tags.json';
import users from '../../../mocks/users.json';
import { itemSchema, updateStatusSchema } from './item';
import { loginSchema, validateLogin } from './login';
import { postSchema, tagSchema } from './post';
import { itemsQuerySchema, postQuerySchema } from './query';
import { sessionUserSchema, userRecordSchema } from './user';

const validItem = items[0];
const validPost = posts[0];

describe('the shipped mock data satisfies the schemas', () => {
	it('parses every post, tag, item and user', () => {
		expect(z.array(postSchema).parse(posts)).toHaveLength(20);
		expect(z.array(tagSchema).parse(tags)).toHaveLength(8);
		expect(z.array(itemSchema).parse(items)).toHaveLength(220);
		expect(z.array(userRecordSchema).parse(users)).toHaveLength(3);
	});

	it('is referentially consistent: every used tag is in the taxonomy', () => {
		const known = new Set(tags.map((tag) => tag.slug));
		const used = [...posts.flatMap((post) => post.tags), ...items.flatMap((item) => item.tags)];
		expect(used.filter((slug) => !known.has(slug))).toEqual([]);
	});

	it('has unique ids, slugs and emails', () => {
		const unique = (values: string[]) => new Set(values).size === values.length;
		expect(unique(items.map((item) => item.id))).toBe(true);
		expect(unique(posts.map((post) => post.id))).toBe(true);
		expect(unique(posts.map((post) => post.slug))).toBe(true);
		expect(unique(users.map((user) => user.email))).toBe(true);
	});
});

describe('itemSchema', () => {
	const issues = (candidate: unknown) => {
		const result = itemSchema.safeParse(candidate);
		return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
	};

	it('rejects an unknown status or channel', () => {
		expect(issues({ ...validItem, status: 'deleted' })).toContain('status');
		expect(issues({ ...validItem, channel: 'fax' })).toContain('channel');
	});

	it('rejects a ctr outside 0..1 and negative money', () => {
		expect(issues({ ...validItem, ctr: 1.2 })).toContain('ctr');
		expect(issues({ ...validItem, budget: -1 })).toContain('budget');
	});

	it('rejects malformed dates', () => {
		expect(issues({ ...validItem, startDate: '03/04/2026' })).toContain('startDate');
		expect(issues({ ...validItem, updatedAt: '2026-04-09' })).toContain('updatedAt');
	});

	it('rejects an end date before the start date', () => {
		expect(issues({ ...validItem, startDate: '2026-05-01', endDate: '2026-04-01' })).toEqual([
			'endDate'
		]);
	});

	it('rejects a missing owner', () => {
		expect(issues({ ...validItem, owner: undefined })).toContain('owner');
	});
});

describe('postSchema', () => {
	it('requires a translation for every locale', () => {
		const onlyEnglish = { en: validPost.translations.en };
		expect(postSchema.safeParse({ ...validPost, translations: onlyEnglish }).success).toBe(false);
	});

	it('rejects a slug that is not url-safe and a bad color', () => {
		expect(postSchema.safeParse({ ...validPost, slug: 'Not A Slug' }).success).toBe(false);
		expect(postSchema.safeParse({ ...validPost, coverColor: 'blue' }).success).toBe(false);
	});
});

describe('user schemas', () => {
	it('never lets the password into the session user', () => {
		const sessionUser = sessionUserSchema.parse(users[0]);
		expect(sessionUser).not.toHaveProperty('password');
	});

	it('rejects an unknown role', () => {
		expect(userRecordSchema.safeParse({ ...users[0], role: 'owner' }).success).toBe(false);
	});
});

describe('loginSchema', () => {
	it('accepts a valid form', () => {
		expect(loginSchema.safeParse({ email: 'admin@demo.test', password: 'x' }).success).toBe(true);
	});

	it('reports codes the UI can translate', () => {
		const result = loginSchema.safeParse({ email: 'nope', password: '' });
		expect(result.success).toBe(false);
		const messages = result.error?.issues.map((issue) => issue.message);
		expect(messages).toEqual(['invalid_email', 'required']);
	});
});

describe('validateLogin', () => {
	it('returns the trimmed data when the form is valid', () => {
		expect(validateLogin({ email: '  admin@demo.test ', password: 'x' })).toEqual({
			ok: true,
			data: { email: 'admin@demo.test', password: 'x' }
		});
	});

	it('names the field and the problem, one per field', () => {
		expect(validateLogin({ email: 'nope', password: '' })).toEqual({
			ok: false,
			errors: { email: 'invalid_email', password: 'required' }
		});
	});

	it('calls an empty or blank email missing, not malformed', () => {
		for (const email of ['', '   ']) {
			const result = validateLogin({ email, password: 'x' });
			expect(result).toEqual({ ok: false, errors: { email: 'required' } });
		}
	});

	it('does not trim the password', () => {
		const result = validateLogin({ email: 'a@b.test', password: ' ' });
		expect(result.ok).toBe(true);
	});
});

describe('updateStatusSchema', () => {
	it('only accepts a known status', () => {
		expect(updateStatusSchema.safeParse({ id: 'cmp_0001', status: 'active' }).success).toBe(true);
		expect(updateStatusSchema.safeParse({ id: 'cmp_0001', status: 'gone' }).success).toBe(false);
		expect(updateStatusSchema.safeParse({ id: '', status: 'active' }).success).toBe(false);
	});
});

describe('postQuerySchema: a hand-edited URL never breaks the page', () => {
	it('fills in defaults for an empty query', () => {
		expect(postQuerySchema.parse({})).toEqual({ q: '', tag: '', sort: 'newest', page: 1 });
	});

	it('coerces numbers from strings', () => {
		expect(postQuerySchema.parse({ page: '3' }).page).toBe(3);
	});

	it('falls back on garbage instead of throwing', () => {
		const parsed = postQuerySchema.parse({ page: '-4', sort: 'random', q: 'x'.repeat(500) });
		expect(parsed).toEqual({ q: '', tag: '', sort: 'newest', page: 1 });
	});

	it('trims the search text', () => {
		expect(postQuerySchema.parse({ q: '  svelte ' }).q).toBe('svelte');
	});
});

describe('itemsQuerySchema', () => {
	it('fills in defaults for an empty query', () => {
		expect(itemsQuerySchema.parse({})).toEqual({
			page: 1,
			perPage: 10,
			sort: 'updatedAt',
			dir: 'desc',
			q: '',
			status: '',
			channel: '',
			owner: ''
		});
	});

	it('accepts valid values, coercing numbers', () => {
		const parsed = itemsQuerySchema.parse({
			page: '2',
			perPage: '25',
			sort: 'budget',
			dir: 'asc',
			status: 'active',
			channel: 'email',
			owner: 'u_anna'
		});
		expect(parsed).toMatchObject({
			page: 2,
			perPage: 25,
			sort: 'budget',
			dir: 'asc',
			status: 'active',
			channel: 'email',
			owner: 'u_anna'
		});
	});

	it('only allows the offered page sizes', () => {
		expect(itemsQuerySchema.parse({ perPage: '7' }).perPage).toBe(10);
		expect(itemsQuerySchema.parse({ perPage: '1000' }).perPage).toBe(10);
	});

	it('ignores an unknown sort key, direction, status or channel', () => {
		const parsed = itemsQuerySchema.parse({
			sort: 'password',
			dir: 'sideways',
			status: 'deleted',
			channel: 'fax'
		});
		expect(parsed).toMatchObject({ sort: 'updatedAt', dir: 'desc', status: '', channel: '' });
	});
});
