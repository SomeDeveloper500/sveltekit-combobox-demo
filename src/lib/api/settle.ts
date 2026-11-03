/** The outcome of something that may fail, as a value: a page can show each part's state. */
export type Settled<T> = { ok: true; value: T } | { ok: false };

/**
 * Turns a promise that may reject into one that never does. A streamed part of a page that fails
 * must not take the whole page down: the caller renders `{ ok: false }` as that part's error state
 * and the rest keeps working. `onError` is where the cause goes (a log); the page never sees it.
 */
export function settle<T>(
	work: Promise<T>,
	onError: (cause: unknown) => void = () => {}
): Promise<Settled<T>> {
	return work.then(
		(value) => ({ ok: true, value }),
		(cause: unknown) => {
			onError(cause);
			return { ok: false };
		}
	);
}
