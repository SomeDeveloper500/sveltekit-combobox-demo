import { describe, expect, it } from 'vitest';
import { SIGNED_IN_HINT_COOKIE, hasSignedInHint } from './hint.js';

describe('hasSignedInHint', () => {
	it('is true when the hint is set', () => {
		expect(hasSignedInHint(`${SIGNED_IN_HINT_COOKIE}=1`)).toBe(true);
	});

	it('finds the hint among other cookies', () => {
		expect(hasSignedInHint(`theme=dark; ${SIGNED_IN_HINT_COOKIE}=1; other=x`)).toBe(true);
	});

	it('is false without it', () => {
		expect(hasSignedInHint('')).toBe(false);
		expect(hasSignedInHint('theme=dark')).toBe(false);
	});

	it('ignores a cookie that merely ends with the name or has another value', () => {
		expect(hasSignedInHint(`not-${SIGNED_IN_HINT_COOKIE}=1`)).toBe(false);
		expect(hasSignedInHint(`${SIGNED_IN_HINT_COOKIE}=0`)).toBe(false);
		expect(hasSignedInHint(`${SIGNED_IN_HINT_COOKIE}=10`)).toBe(false);
	});
});
