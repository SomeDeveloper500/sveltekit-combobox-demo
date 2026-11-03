import { describe, expect, it, vi } from 'vitest';
import { settle } from './settle.js';

describe('settle', () => {
	it('wraps a value', async () => {
		expect(await settle(Promise.resolve(42))).toEqual({ ok: true, value: 42 });
	});

	it('turns a rejection into a failed outcome instead of throwing', async () => {
		expect(await settle(Promise.reject(new Error('boom')))).toEqual({ ok: false });
	});

	it('hands the cause to onError, and only on failure', async () => {
		const onError = vi.fn();
		await settle(Promise.resolve(1), onError);
		expect(onError).not.toHaveBeenCalled();
		const cause = new Error('boom');
		await settle(Promise.reject(cause), onError);
		expect(onError).toHaveBeenCalledExactlyOnceWith(cause);
	});

	it('does not leak the cause into the outcome', async () => {
		expect(Object.keys(await settle(Promise.reject(new Error('secret'))))).toEqual(['ok']);
	});
});
