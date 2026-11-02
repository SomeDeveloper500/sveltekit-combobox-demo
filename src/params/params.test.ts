import { describe, expect, it } from 'vitest';
import { LOCALES } from '#lib/schemas/common.js';
import { params } from './index';

/** What SvelteKit does with a matcher: run the Standard Schema validator on the URL segment. */
const matches = (param: string) => {
	const result = params.locale['~standard'].validate(param);
	if (result instanceof Promise) throw new Error('the locale matcher must be synchronous');
	return result.issues === undefined;
};

describe('the locale param matcher', () => {
	it('matches the supported locales', () => {
		expect(matches('en')).toBe(true);
		expect(matches('de')).toBe(true);
	});

	it('matches exactly the locales the app supports, so the two cannot drift apart', () => {
		for (const locale of LOCALES) expect(matches(locale), locale).toBe(true);
	});

	it('rejects other languages, other cases and look-alikes', () => {
		for (const param of ['fr', 'EN', 'De', 'english', 'e', '', 'en ', 'blog', '..']) {
			expect(matches(param), JSON.stringify(param)).toBe(false);
		}
	});
});
