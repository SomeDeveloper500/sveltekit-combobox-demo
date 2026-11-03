import { describe, expect, it } from 'vitest';
import { handleError } from './hooks.client';

type Input = Parameters<typeof handleError>[0];
const input = (kind: string) => ({ kind, error: new Error('x') }) as unknown as Input;

describe('handleError (client)', () => {
	it('gives an unexpected error a reference to show', async () => {
		expect(await handleError(input('unknown'))).toEqual({
			id: expect.stringMatching(/^[0-9a-f]{8}$/)
		});
	});

	it('treats a missing page or a deliberate error as normal traffic, not an incident', async () => {
		expect(await handleError(input('framework'))).toBeUndefined();
	});
});
