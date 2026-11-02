import { describe, expect, it } from 'vitest';
import { applySecurityHeaders } from './security';

const http = new URL('http://localhost:5173/en');
const https = new URL('https://example.test/en');

describe('applySecurityHeaders', () => {
	it('puts the security headers on a response', () => {
		const response = applySecurityHeaders(new Response('ok'), http);
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
		expect(response.headers.get('x-frame-options')).toBe('DENY');
		expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
	});

	it('switches off the browser features the app never uses', () => {
		const policy = applySecurityHeaders(new Response('ok'), http).headers.get('permissions-policy');
		for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
			expect(policy).toContain(`${feature}=()`);
		}
	});

	it('sends HSTS over HTTPS only', () => {
		expect(
			applySecurityHeaders(new Response('ok'), https).headers.get('strict-transport-security')
		).toBe('max-age=31536000; includeSubDomains');
		expect(
			applySecurityHeaders(new Response('ok'), http).headers.has('strict-transport-security')
		).toBe(false);
	});

	it('keeps the status, the body and the other headers', async () => {
		const original = new Response('hello', {
			status: 404,
			headers: { 'content-type': 'text/plain', 'x-custom': 'yes' }
		});
		const response = applySecurityHeaders(original, http);
		expect(response.status).toBe(404);
		expect(await response.text()).toBe('hello');
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(response.headers.get('x-custom')).toBe('yes');
	});

	it('overrides a weaker value set earlier', () => {
		const response = applySecurityHeaders(
			new Response('ok', { headers: { 'x-frame-options': 'SAMEORIGIN' } }),
			http
		);
		expect(response.headers.get('x-frame-options')).toBe('DENY');
	});

	it('copes with a response whose headers cannot be changed', () => {
		const redirect = Response.redirect('https://example.test/en', 307); // immutable headers
		expect(() => redirect.headers.set('x', 'y')).toThrow();
		const response = applySecurityHeaders(redirect, https);
		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('https://example.test/en');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('strict-transport-security')).toBeTruthy();
	});
});
