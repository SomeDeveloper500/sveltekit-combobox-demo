import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { compressResponse } from './compress';

const page = '<!doctype html><title>x</title>' + '<p>hello</p>'.repeat(500);

const ask = (encoding?: string, method = 'GET') =>
	new Request('https://example.test/en/blog', {
		method,
		headers: encoding === undefined ? {} : { 'accept-encoding': encoding }
	});
const html = (init: ResponseInit = {}) =>
	new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' }, ...init });

describe('compressResponse', () => {
	it('gzips an HTML page for a browser that accepts it, and the page survives the trip', async () => {
		const response = compressResponse(ask('gzip, deflate, br'), html());
		expect(response.headers.get('content-encoding')).toBe('gzip');
		const bytes = Buffer.from(await response.arrayBuffer());
		expect(bytes.length).toBeLessThan(page.length / 5);
		expect(gunzipSync(bytes).toString()).toBe(page);
	});

	it('says that the answer depends on what the browser accepts', () => {
		const response = compressResponse(
			ask('gzip'),
			html({ headers: { 'content-type': 'text/html', vary: 'Accept-Language' } })
		);
		expect(response.headers.get('vary')).toBe('Accept-Language, Accept-Encoding');
	});

	it('drops the old content length, which no longer fits', () => {
		const response = compressResponse(
			ask('gzip'),
			html({ headers: { 'content-type': 'text/html', 'content-length': String(page.length) } })
		);
		expect(response.headers.has('content-length')).toBe(false);
	});

	it('keeps the status and the other headers', () => {
		const response = compressResponse(
			ask('gzip'),
			html({ headers: { 'content-type': 'text/html', 'cache-control': 'private, no-store' } })
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});

	it.each([
		['a browser that does not accept gzip', ask('identity')],
		['a request with no preference', ask()],
		['a HEAD request', ask('gzip', 'HEAD')]
	])('leaves the page alone for %s', async (_name, request) => {
		const response = compressResponse(request, html());
		expect(response.headers.has('content-encoding')).toBe(false);
		expect(await response.text()).toBe(page);
	});

	it('leaves alone what is already encoded, so a proxy is not asked to compress twice', () => {
		const encoded = html({ headers: { 'content-type': 'text/html', 'content-encoding': 'br' } });
		expect(compressResponse(ask('gzip'), encoded).headers.get('content-encoding')).toBe('br');
	});

	it('leaves alone what is not an HTML page: data may stream, and a compressor would hold it back', () => {
		const data = new Response('{}', { headers: { 'content-type': 'application/json' } });
		expect(compressResponse(ask('gzip'), data).headers.has('content-encoding')).toBe(false);
	});

	it('leaves alone redirects and errors, which have little to compress', () => {
		expect(
			compressResponse(ask('gzip'), html({ status: 404 })).headers.has('content-encoding')
		).toBe(false);
		expect(
			compressResponse(
				ask('gzip'),
				new Response(null, { status: 303, headers: { location: '/' } })
			).headers.has('content-encoding')
		).toBe(false);
	});
});
