import { describe, expect, it } from 'vitest';
import { accessDecision, isPrivatePath, isProtectedPath, markPrivate } from './access.js';

describe('isProtectedPath', () => {
	it('protects the dashboard and everything under it, in every language', () => {
		for (const path of [
			'/en/dashboard',
			'/de/dashboard',
			'/en/dashboard/items',
			'/de/dashboard/items/x'
		]) {
			expect(isProtectedPath(path), path).toBe(true);
		}
	});

	it('leaves public pages open', () => {
		for (const path of [
			'/',
			'/en',
			'/en/blog',
			'/en/search',
			'/en/login',
			'/en/dashboards',
			'/en/blog/dashboard'
		]) {
			expect(isProtectedPath(path), path).toBe(false);
		}
	});
});

describe('isPrivatePath', () => {
	it('covers the login page and the dashboard', () => {
		expect(isPrivatePath('/en/login')).toBe(true);
		expect(isPrivatePath('/de/dashboard/items')).toBe(true);
		expect(isPrivatePath('/en/blog')).toBe(false);
		expect(isPrivatePath('/en')).toBe(false);
	});
});

describe('accessDecision', () => {
	const base = {
		pathname: '/en/dashboard/items',
		search: () => '?page=2&sort=name',
		lang: 'en' as const,
		method: 'GET',
		accept: 'text/html,application/xhtml+xml'
	};

	it('sends an anonymous browser to the login page with the way back', () => {
		const decision = accessDecision({ ...base, signedIn: false });
		expect(decision?.kind).toBe('login');
		const location = (decision as { location: string }).location;
		expect(location.startsWith('/en/login?next=')).toBe(true);
		expect(new URLSearchParams(location.split('?')[1]).get('next')).toBe(
			'/en/dashboard/items?page=2&sort=name'
		);
	});

	it('uses the language of the request', () => {
		const decision = accessDecision({
			...base,
			pathname: '/de/dashboard',
			search: () => '',
			lang: 'de',
			signedIn: false
		});
		expect(decision).toEqual({ kind: 'login', location: '/de/login?next=%2Fde%2Fdashboard' });
	});

	it('lets a signed-in user through', () => {
		expect(accessDecision({ ...base, signedIn: true })).toBeNull();
	});

	it('does not touch public pages', () => {
		for (const pathname of ['/en/blog', '/en/login', '/en']) {
			expect(accessDecision({ ...base, pathname, signedIn: false }), pathname).toBeNull();
		}
	});

	it('answers a script that wants JSON with 401, not with a page of HTML', () => {
		expect(accessDecision({ ...base, accept: 'application/json', signedIn: false })).toEqual({
			kind: 'unauthorized'
		});
	});

	it('answers a write that reads no HTML with 401', () => {
		expect(accessDecision({ ...base, method: 'POST', accept: '*/*', signedIn: false })).toEqual({
			kind: 'unauthorized'
		});
		expect(accessDecision({ ...base, method: 'PATCH', accept: null, signedIn: false })).toEqual({
			kind: 'unauthorized'
		});
	});

	it('still sends a browser that posts a form to the login page', () => {
		const decision = accessDecision({ ...base, method: 'POST', signedIn: false });
		expect(decision?.kind).toBe('login');
	});

	it('treats a plain GET with no Accept header as a page request', () => {
		expect(accessDecision({ ...base, accept: null, signedIn: false })?.kind).toBe('login');
	});

	it('encodes a query that would otherwise end the next parameter', () => {
		const decision = accessDecision({
			...base,
			pathname: '/en/dashboard',
			search: () => '?a=1&next=/evil',
			signedIn: false
		}) as { location: string };
		expect(new URLSearchParams(decision.location.split('?')[1]).get('next')).toBe(
			'/en/dashboard?a=1&next=/evil'
		);
	});
});

describe('markPrivate', () => {
	it('forbids shared caches', () => {
		expect(markPrivate(new Response('x')).headers.get('cache-control')).toBe('private, no-store');
	});
});
