import { normalize } from '../../text';

type Option = { label: string; disabled?: boolean };

// Re-exported: callers of the combobox helpers match with the same rules.
export { normalize };

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
