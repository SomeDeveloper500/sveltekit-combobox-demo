import { describe, expect, it } from 'vitest';
import { filterOptions, firstEnabledIndex, moveActive, normalize } from './combobox';

const options = [
	{ label: 'Accessibility' },
	{ label: 'Café' },
	{ label: 'Legacy', disabled: true },
	{ label: 'Svelte' }
];

describe('normalize', () => {
	it('lower-cases and strips accents', () => {
		expect(normalize('Café Ünïcode')).toBe('cafe unicode');
	});

	it('folds letters that do not decompose', () => {
		expect(normalize('Łódź')).toBe('lodz');
		expect(normalize('Straße Ørsted Æble')).toBe('strasse orsted aeble');
	});

	it('treats the Turkish dotted and dotless i as i', () => {
		expect(normalize('İstanbul Işık')).toBe('istanbul isik');
	});
});

describe('filterOptions', () => {
	it('keeps everything for an empty or blank query', () => {
		expect(filterOptions(options, '')).toHaveLength(4);
		expect(filterOptions(options, '   ')).toHaveLength(4);
	});

	it('matches case-insensitively anywhere in the label', () => {
		expect(filterOptions(options, 'VELT').map((option) => option.label)).toEqual(['Svelte']);
	});

	it('matches accented labels with plain letters', () => {
		expect(filterOptions(options, 'cafe').map((option) => option.label)).toEqual(['Café']);
	});

	it('finds Polish labels with plain letters', () => {
		const polish = [{ label: 'Łódź' }, { label: 'Kraków' }];
		expect(filterOptions(polish, 'lodz')).toEqual([{ label: 'Łódź' }]);
		expect(filterOptions(polish, 'krakow')).toEqual([{ label: 'Kraków' }]);
	});

	it('ignores surrounding whitespace in the query', () => {
		expect(filterOptions(options, '  access ').map((option) => option.label)).toEqual([
			'Accessibility'
		]);
	});

	it('keeps disabled options (they are shown, just not selectable)', () => {
		expect(filterOptions(options, 'leg')).toEqual([{ label: 'Legacy', disabled: true }]);
	});

	it('returns an empty list when nothing matches', () => {
		expect(filterOptions(options, 'zzz')).toEqual([]);
	});

	it('does not mutate or alias the input', () => {
		const all = filterOptions(options, '');
		expect(all).not.toBe(options);
		expect(options).toHaveLength(4);
	});
});

describe('moveActive', () => {
	it('starts at the first option going forward and the last going backward', () => {
		expect(moveActive(options, -1, 1)).toBe(0);
		expect(moveActive(options, -1, -1)).toBe(3);
	});

	it('moves one step in either direction', () => {
		expect(moveActive(options, 0, 1)).toBe(1);
		expect(moveActive(options, 3, -1)).toBe(1);
	});

	it('skips disabled options', () => {
		expect(moveActive(options, 1, 1)).toBe(3);
		expect(moveActive(options, 3, -1)).toBe(1);
	});

	it('wraps around at both ends', () => {
		expect(moveActive(options, 3, 1)).toBe(0);
		expect(moveActive(options, 0, -1)).toBe(3);
	});

	it('returns -1 when there is nothing to move to', () => {
		expect(moveActive([], -1, 1)).toBe(-1);
		expect(moveActive([{ label: 'a', disabled: true }], -1, 1)).toBe(-1);
	});

	it('stays on a single enabled option', () => {
		const single = [{ label: 'a' }, { label: 'b', disabled: true }];
		expect(moveActive(single, 0, 1)).toBe(0);
		expect(moveActive(single, 0, -1)).toBe(0);
	});
});

describe('firstEnabledIndex', () => {
	it('finds the first selectable option', () => {
		expect(firstEnabledIndex([{ label: 'a', disabled: true }, { label: 'b' }])).toBe(1);
		expect(firstEnabledIndex([{ label: 'a', disabled: true }])).toBe(-1);
	});
});
