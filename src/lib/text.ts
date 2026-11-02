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
