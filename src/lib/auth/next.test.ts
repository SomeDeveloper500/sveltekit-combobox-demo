import { describe, expect, it } from 'vitest';
import { safeNext } from './next.js';

const FALLBACK = '/en/dashboard';

describe('safeNext', () => {
	it('keeps a path on this site, with its query and hash', () => {
		expect(safeNext('/en/dashboard/items?page=2&sort=name#top', FALLBACK)).toBe(
			'/en/dashboard/items?page=2&sort=name#top'
		);
		expect(safeNext('/de/dashboard', FALLBACK)).toBe('/de/dashboard');
	});

	it('uses the fallback when there is nothing', () => {
		expect(safeNext(null, FALLBACK)).toBe(FALLBACK);
		expect(safeNext(undefined, FALLBACK)).toBe(FALLBACK);
		expect(safeNext('', FALLBACK)).toBe(FALLBACK);
	});

	it('refuses other sites, however they are written', () => {
		const attacks = [
			'https://evil.example',
			'http://evil.example/en/dashboard',
			'//evil.example',
			'//evil.example/en/dashboard',
			'/\\evil.example',
			'\\\\evil.example',
			'/\\/evil.example',
			'javascript:alert(1)',
			'data:text/html,hi',
			'evil.example',
			'en/dashboard',
			'  //evil.example',
			'\t//evil.example',
			'/\t/evil.example',
			'/\n/evil.example',
			'///evil.example'
		];
		for (const attack of attacks) expect(safeNext(attack, FALLBACK), attack).toBe(FALLBACK);
	});

	it('accepts an encoded slash, which stays a path on this site', () => {
		expect(safeNext('/%2Fevil.example', FALLBACK)).toBe('/%2Fevil.example');
	});

	it('refuses control characters', () => {
		expect(safeNext('/en/dash\u0000board', FALLBACK)).toBe(FALLBACK);
		expect(safeNext('/en/dash\u007fboard', FALLBACK)).toBe(FALLBACK);
	});

	it('refuses the login page, so a signed-in user is not sent back to the form', () => {
		expect(safeNext('/en/login', FALLBACK)).toBe(FALLBACK);
		expect(safeNext('/de/login?next=/en/dashboard', FALLBACK)).toBe(FALLBACK);
	});

	it('normalizes dot segments', () => {
		expect(safeNext('/en/dashboard/../blog', FALLBACK)).toBe('/en/blog');
		expect(safeNext('/en/../../../etc', FALLBACK)).toBe('/etc');
	});

	it('refuses an absurdly long value', () => {
		expect(safeNext(`/${'a'.repeat(3000)}`, FALLBACK)).toBe(FALLBACK);
	});
});
