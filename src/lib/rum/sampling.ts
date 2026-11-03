/** A rate as a probability: anything that is not a number in [0, 1] is pulled into it. */
export function clampRate(rate: number): number {
	if (Number.isNaN(rate)) return 0;
	return Math.min(1, Math.max(0, rate));
}

/**
 * Whether this page load is in the sample. Decided once per load, not per metric: a page is either
 * measured whole or not at all, so LCP, INP and CLS of one visit stay together. `random` is
 * injectable for tests; a rate of 1 always passes and a rate of 0 never does.
 */
export function sampled(rate: number, random: () => number = Math.random): boolean {
	const probability = clampRate(rate);
	return probability > 0 && random() < probability;
}

/**
 * Keeps one broken component from flooding the endpoint: an error already reported is not sent
 * again, and a page sends at most `limit` distinct errors.
 */
export class ErrorBudget {
	readonly #seen = new Set<string>();
	readonly #limit: number;

	constructor(limit = 5) {
		this.#limit = limit;
	}

	admit(key: string): boolean {
		if (this.#seen.has(key) || this.#seen.size >= this.#limit) return false;
		this.#seen.add(key);
		return true;
	}
}
