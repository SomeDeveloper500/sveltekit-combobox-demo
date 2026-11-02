import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DataValidationError, parseCollection } from './validate';

const rowSchema = z.object({ id: z.string(), count: z.number().int() });

const message = (run: () => unknown) => {
	try {
		run();
	} catch (error) {
		expect(error).toBeInstanceOf(DataValidationError);
		return (error as Error).message;
	}
	throw new Error('expected parseCollection to throw');
};

describe('parseCollection', () => {
	it('returns the typed rows of a valid collection', () => {
		const rows = parseCollection('rows.json', rowSchema, [
			{ id: 'a', count: 1 },
			{ id: 'b', count: 2 }
		]);
		expect(rows).toEqual([
			{ id: 'a', count: 1 },
			{ id: 'b', count: 2 }
		]);
	});

	it('accepts an empty collection', () => {
		expect(parseCollection('rows.json', rowSchema, [])).toEqual([]);
	});

	it.each([
		['an object', {}, 'object'],
		['null', null, 'null'],
		['a string', 'oops', 'string']
	])('rejects %s instead of an array and says what it got', (_label, raw, got) => {
		const text = message(() => parseCollection('rows.json', rowSchema, raw));
		expect(text).toContain('rows.json');
		expect(text).toContain(`expected an array, got ${got}`);
	});

	it('names the file, the row index and the field of every bad row', () => {
		const text = message(() =>
			parseCollection('rows.json', rowSchema, [
				{ id: 'a', count: 1 },
				{ id: 'b', count: 'many' },
				{ id: 3, count: 1 }
			])
		);
		expect(text).toContain('rows.json');
		expect(text).toContain('[1].count');
		expect(text).toContain('[2].id');
		expect(text).toContain('2 problem(s)');
	});

	it('lists only the first problems and counts the rest', () => {
		const bad = Array.from({ length: 12 }, () => ({ id: 'x', count: 'nope' }));
		const text = message(() => parseCollection('rows.json', rowSchema, bad));
		expect(text).toContain('12 problem(s)');
		expect(text).toContain('…and 7 more');
		expect(text.split('\n').filter((line) => line.startsWith('  - '))).toHaveLength(5);
	});

	it('exposes the problems for callers that want them', () => {
		try {
			parseCollection('rows.json', rowSchema, [{ id: 'a', count: 'x' }]);
		} catch (error) {
			expect((error as DataValidationError).file).toBe('rows.json');
			expect((error as DataValidationError).problems).toHaveLength(1);
		}
		expect.assertions(2);
	});

	it('rejects duplicate values of a field that must be unique', () => {
		const text = message(() =>
			parseCollection(
				'rows.json',
				rowSchema,
				[
					{ id: 'a', count: 1 },
					{ id: 'a', count: 2 }
				],
				{ id: (row) => row.id }
			)
		);
		expect(text).toContain('duplicate id: "a"');
	});

	it('does not report uniqueness problems for rows that already failed the schema', () => {
		const text = message(() =>
			parseCollection(
				'rows.json',
				rowSchema,
				[
					{ id: 'a', count: 'x' },
					{ id: 'a', count: 'y' }
				],
				{ id: (row) => row.id }
			)
		);
		expect(text).not.toContain('duplicate');
	});
});
