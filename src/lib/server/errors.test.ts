import type { HandleServerError } from '@sveltejs/kit/hooks';
import { describe, expect, it, vi } from 'vitest';
import { toAppError } from './errors';

type Input = Parameters<HandleServerError>[0];

const event = {
	request: new Request('https://example.test/de/blog', { method: 'POST' }),
	url: new URL('https://example.test/de/blog')
} as Input['event'];

const unknown = (error: unknown = new Error('database is down')): Input =>
	({ kind: 'unknown', error, event }) as Input;

describe('toAppError: unexpected errors', () => {
	it('returns a reference and logs the incident under it', () => {
		const log = vi.fn();
		const cause = new Error('database is down');
		const result = toAppError(unknown(cause), { log, newId: () => 'abc12345' });
		expect(result).toEqual({ id: 'abc12345' });
		expect(log).toHaveBeenCalledOnce();
		expect(log).toHaveBeenCalledWith('[abc12345] POST /de/blog', cause);
	});

	it('does not put the cause into what the visitor receives', () => {
		const result = toAppError(unknown(new Error('password=hunter2')), { log: vi.fn() });
		expect(JSON.stringify(result)).not.toContain('hunter2');
		expect(Object.keys(result ?? {})).toEqual(['id']);
	});

	it('gives each incident its own short reference', () => {
		const ids = new Set(
			Array.from({ length: 50 }, () => toAppError(unknown(), { log: vi.fn() })?.id)
		);
		expect(ids.size).toBe(50);
		for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}$/);
	});

	it('logs a thrown value that is not an Error as well', () => {
		const log = vi.fn();
		toAppError(unknown('just a string'), { log, newId: () => 'id' });
		expect(log).toHaveBeenCalledWith('[id] POST /de/blog', 'just a string');
	});

	it('never throws, even when the logger does', () => {
		const log = () => {
			throw new Error('log sink is down');
		};
		expect(() => toAppError(unknown(), { log, newId: () => 'id' })).not.toThrow();
		expect(toAppError(unknown(), { log, newId: () => 'id' })).toEqual({ id: 'id' });
	});
});

describe('toAppError: expected errors', () => {
	it.each(['app', 'framework'] as const)('leaves a %s error alone and does not log it', (kind) => {
		const log = vi.fn();
		const input = { kind, error: { status: 404, message: 'Not Found' }, event } as Input;
		expect(toAppError(input, { log })).toBeUndefined();
		expect(log).not.toHaveBeenCalled();
	});
});
