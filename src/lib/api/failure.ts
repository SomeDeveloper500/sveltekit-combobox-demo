/**
 * What went wrong with a request, as far as the person using the page needs to tell:
 *
 * - `network`: no answer at all (offline, dropped connection, timeout). Worth trying again.
 * - `validation`: the server read the request and rejected its content (400, 422). Fix the input.
 * - `unauthenticated`: not signed in, or the session ended (401). Sign in again.
 * - `forbidden`: signed in but not allowed (403). Retrying will not help.
 * - `not_found`: the thing is gone (404).
 * - `conflict`: the thing changed underneath you, or the move is not allowed from its state (409).
 * - `server`: our side broke (5xx). Worth trying again later.
 *
 * Each needs different wording and a different way back, so they are kept apart instead of one
 * "something went wrong". Pure, so every form and every optimistic update classifies the same way.
 */
export type FailureKind =
	| 'network'
	| 'validation'
	| 'unauthenticated'
	| 'forbidden'
	| 'not_found'
	| 'conflict'
	| 'server'
	| 'unknown';

/** `status` is the HTTP status when there was a response, and `undefined` when there was none. */
export function classifyFailure(status: number | undefined): FailureKind {
	if (status === undefined || status === 0) return 'network';
	if (status === 400 || status === 422) return 'validation';
	if (status === 401) return 'unauthenticated';
	if (status === 403) return 'forbidden';
	if (status === 404) return 'not_found';
	if (status === 409) return 'conflict';
	if (status >= 500) return 'server';
	return 'unknown';
}

/** Whether trying the same request again, unchanged, can succeed. */
export function isRetryable(kind: FailureKind): boolean {
	return kind === 'network' || kind === 'server';
}
