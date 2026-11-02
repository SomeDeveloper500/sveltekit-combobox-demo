import type { RequestEvent } from '@sveltejs/kit';
import type { ResolveOptions } from '@sveltejs/kit/hooks';
import { describe, expect, it, vi } from 'vitest';
import { handle, handleError } from './hooks.server';

type Options = { method?: string; acceptLanguage?: string };

/** Runs `handle` on a fake request; `resolve` stands in for the rest of SvelteKit. */
async function run(path: string, { method = 'GET', acceptLanguage }: Options = {}) {
	const url = new URL(path, 'https://example.test');
	const headers = new Headers(acceptLanguage ? { 'accept-language': acceptLanguage } : {});
	const event = { url, request: new Request(url, { method, headers }), locals: {} } as RequestEvent;
	let options: ResolveOptions | undefined;
	const resolve = vi.fn(async (_event: RequestEvent, opts?: ResolveOptions) => {
		options = opts;
		return new Response('<html lang="%lang%"></html>');
	});
	const response = await handle({ event, resolve } as Parameters<typeof handle>[0]);
	const html = options?.transformPageChunk
		? await options.transformPageChunk({ html: '<html lang="%lang%">', done: true })
		: null;
	return { response, event, resolve, html };
}

describe('handle: redirects', () => {
	it('sends the root to the language of the visitor with a temporary redirect', async () => {
		const { response, resolve } = await run('/', { acceptLanguage: 'de-DE,de;q=0.9' });
		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('/de');
		expect(resolve).not.toHaveBeenCalled();
	});

	it('tells caches the answer depends on Accept-Language', async () => {
		const { response } = await run('/', { acceptLanguage: 'de' });
		expect(response.headers.get('vary')).toBe('Accept-Language');
	});

	it('sends a section without a locale to its localized URL, keeping the query', async () => {
		const { response } = await run('/search?q=svelte', { acceptLanguage: 'de' });
		expect(response.headers.get('location')).toBe('/de/search?q=svelte');
	});

	it('answers HEAD like GET', async () => {
		expect((await run('/', { method: 'HEAD', acceptLanguage: 'de' })).response.status).toBe(307);
	});

	it('leaves a POST to a locale-less section alone', async () => {
		const { response, resolve } = await run('/login', { method: 'POST', acceptLanguage: 'de' });
		expect(response.status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});
});

describe('handle: the language of a request', () => {
	it('takes the locale from the URL, whatever the browser prefers', async () => {
		expect((await run('/en/blog', { acceptLanguage: 'de' })).event.locals.lang).toBe('en');
		expect((await run('/de', { acceptLanguage: 'en' })).event.locals.lang).toBe('de');
	});

	it('uses the browser preference where the URL has no locale', async () => {
		expect((await run('/sandbox', { acceptLanguage: 'de' })).event.locals.lang).toBe('de');
		expect((await run('/no-such-page', { acceptLanguage: 'de-AT' })).event.locals.lang).toBe('de');
	});

	it('defaults to English', async () => {
		expect((await run('/sandbox')).event.locals.lang).toBe('en');
		expect((await run('/sandbox', { acceptLanguage: 'fr' })).event.locals.lang).toBe('en');
	});

	it('writes the language into the html tag', async () => {
		expect((await run('/de/blog')).html).toBe('<html lang="de">');
		expect((await run('/en')).html).toBe('<html lang="en">');
		expect((await run('/sandbox', { acceptLanguage: 'de' })).html).toBe('<html lang="de">');
	});

	it('passes a localized page on to SvelteKit untouched', async () => {
		const { response, resolve, event } = await run('/en/blog');
		expect(resolve).toHaveBeenCalledWith(event, expect.any(Object));
		expect(response.status).toBe(200);
	});
});

describe('handle: security headers', () => {
	it('puts them on a normal response', async () => {
		const { response } = await run('/en/blog');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('x-frame-options')).toBe('DENY');
	});

	it('puts them on a redirect too', async () => {
		const { response } = await run('/', { acceptLanguage: 'de' });
		expect(response.status).toBe(307);
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
	});

	it('keeps the headers a redirect already had', async () => {
		const { response } = await run('/', { acceptLanguage: 'de' });
		expect(response.headers.get('vary')).toBe('Accept-Language');
		expect(response.headers.get('location')).toBe('/de');
	});
});

describe('handleError', () => {
	it('is the hook that gives unexpected errors a reference', () => {
		const event = {
			request: new Request('https://example.test/en'),
			url: new URL('https://example.test/en')
		} as RequestEvent;
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = handleError({ kind: 'unknown', error: new Error('boom'), event } as never);
		expect(result).toEqual({ id: expect.stringMatching(/^[0-9a-f]{8}$/) });
		log.mockRestore();
	});
});
