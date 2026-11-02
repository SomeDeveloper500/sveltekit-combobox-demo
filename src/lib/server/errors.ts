import type { HandleServerError } from '@sveltejs/kit/hooks';

type Input = Parameters<HandleServerError>[0];

type Deps = {
	log?: (...args: unknown[]) => void;
	newId?: () => string;
};

/** A short reference a visitor can quote and a developer can search the logs for. */
const shortId = () => crypto.randomUUID().slice(0, 8);

/**
 * What `handleError` returns. Only unexpected errors (a bug, a crashed dependency) are logged and
 * given a reference; the visitor sees the generic message plus that reference, never the cause.
 * Errors raised on purpose with `error(404)` and the framework's own 404s are normal traffic: they
 * keep their status and message and are not logged as incidents.
 *
 * It must never throw, so a failing logger cannot turn one error into another.
 */
export function toAppError(
	{ kind, error, event }: Input,
	{ log = console.error, newId = shortId }: Deps = {}
): { id: string } | undefined {
	if (kind !== 'unknown') return undefined;

	const id = newId();
	try {
		log(`[${id}] ${event.request.method} ${event.url.pathname}`, error);
	} catch {
		/* losing a log line is better than losing the response */
	}
	return { id };
}
