export type PageItem = number | 'gap';

/**
 * The page numbers to show: the first and last page, the current page with `siblings` on each
 * side, and a `'gap'` where numbers are skipped. A gap that would hide a single page shows that
 * page instead, so the list never grows an ellipsis for nothing. The length stays constant for a
 * given `siblings`, so the control does not jump while the visitor pages through.
 */
export function pageItems(page: number, pages: number, siblings = 1): PageItem[] {
	if (pages < 1) return [];
	const current = Math.min(Math.max(1, Math.trunc(page)), pages);
	const slots = siblings * 2 + 5; // first, last, current, two gaps, and the siblings
	if (pages <= slots) return Array.from({ length: pages }, (_, i) => i + 1);

	const left = Math.max(current - siblings, 1);
	const right = Math.min(current + siblings, pages);
	const showLeftGap = left > 3;
	const showRightGap = right < pages - 2;

	if (!showLeftGap) {
		const head = Array.from({ length: siblings * 2 + 3 }, (_, i) => i + 1);
		return [...head, 'gap', pages];
	}
	if (!showRightGap) {
		const tail = Array.from({ length: siblings * 2 + 3 }, (_, i) => pages - (siblings * 2 + 2) + i);
		return [1, 'gap', ...tail];
	}
	const middle = Array.from({ length: right - left + 1 }, (_, i) => left + i);
	return [1, 'gap', ...middle, 'gap', pages];
}
