type Option = { label: string; disabled?: boolean };

// Letters that do not decompose into base + accent, so stripping marks alone would miss them.
const FOLDED: Record<string, string> = {
	ł: 'l',
	ø: 'o',
	đ: 'd',
	ß: 'ss',
	æ: 'ae',
	œ: 'oe',
	ı: 'i'
};

/**
 * Case- and accent-insensitive form for matching: "cafe" finds "Café", "lodz" finds "Łódź",
 * and a Turkish "İ" matches "i". Locale-independent on purpose (a plain `toLowerCase`).
 */
export function normalize(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[łøđßæœı]/g, (letter) => FOLDED[letter]);
}

/** Options whose label contains the query anywhere (not only as a prefix); empty keeps all. */
export function filterOptions<T extends Option>(options: readonly T[], query: string): T[] {
	const needle = normalize(query.trim());
	if (!needle) return [...options];
	return options.filter((option) => normalize(option.label).includes(needle));
}

/**
 * The next enabled option in the given direction, wrapping around at both ends.
 * `current = -1` means nothing is active yet: forward finds the first option, backward the last.
 * Returns -1 when every option is disabled (or there are none).
 */
export function moveActive(options: readonly Option[], current: number, direction: 1 | -1): number {
	const count = options.length;
	if (count === 0) return -1;
	let index = current;
	for (let step = 0; step < count; step++) {
		index = index === -1 && direction === -1 ? count - 1 : (index + direction + count) % count;
		if (!options[index].disabled) return index;
	}
	return -1;
}

export function firstEnabledIndex(options: readonly Option[]): number {
	return moveActive(options, -1, 1);
}
