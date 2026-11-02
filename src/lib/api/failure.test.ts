import { describe, expect, it } from 'vitest';
import { classifyFailure, isRetryable, type FailureKind } from './failure.js';

describe('classifyFailure', () => {
	it('calls a missing response a network failure', () => {
		expect(classifyFailure(undefined)).toBe('network');
		expect(classifyFailure(0)).toBe('network');
	});

	it.each<[number, FailureKind]>([
		[400, 'validation'],
		[422, 'validation'],
		[401, 'unauthenticated'],
		[403, 'forbidden'],
		[404, 'not_found'],
		[409, 'conflict'],
		[500, 'server'],
		[502, 'server'],
		[503, 'server']
	])('maps %i to %s', (status, kind) => {
		expect(classifyFailure(status)).toBe(kind);
	});

	it('does not guess for statuses it has no word for', () => {
		expect(classifyFailure(418)).toBe('unknown');
		expect(classifyFailure(429)).toBe('unknown');
	});

	it('keeps 401 and 403 apart: signing in again helps one and not the other', () => {
		expect(classifyFailure(401)).not.toBe(classifyFailure(403));
	});
});

describe('isRetryable', () => {
	it('retries a dead connection and a crash, and nothing the person must fix', () => {
		expect(isRetryable('network')).toBe(true);
		expect(isRetryable('server')).toBe(true);
		for (const kind of [
			'validation',
			'unauthenticated',
			'forbidden',
			'not_found',
			'conflict'
		] as const) {
			expect(isRetryable(kind), kind).toBe(false);
		}
	});
});
