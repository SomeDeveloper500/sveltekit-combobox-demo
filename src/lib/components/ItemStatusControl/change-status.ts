import { classifyFailure, type FailureKind } from '#lib/api/failure.js';
import { ITEM_STATUSES, type ItemStatus } from '#lib/schemas/item.js';

export type ChangeStatusResult =
	{ ok: true; status: ItemStatus; changed: boolean } | { ok: false; kind: FailureKind };

/** How long a change may take before it counts as lost; the interface must not wait forever. */
const TIMEOUT_MS = 10_000;

/**
 * Asks the status endpoint to move a campaign. Never throws: whatever happens comes back as a
 * result, with the failure sorted by `classifyFailure`, so the caller decides what to show and
 * whether to roll back. No answer at all (offline, dropped, too slow) is `network`.
 */
export async function changeStatus(
	url: string,
	status: ItemStatus,
	fetcher: typeof fetch = fetch,
	timeoutMs = TIMEOUT_MS
): Promise<ChangeStatusResult> {
	let response: Response;
	try {
		response = await fetcher(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json' },
			body: JSON.stringify({ status }),
			signal: AbortSignal.timeout(timeoutMs)
		});
	} catch {
		return { ok: false, kind: classifyFailure(undefined) };
	}
	if (!response.ok) return { ok: false, kind: classifyFailure(response.status) };

	// The server's word on what the status is now wins over what was asked for.
	let confirmed: ItemStatus = status;
	let changed = true;
	try {
		const body = (await response.json()) as { item?: { status?: unknown }; changed?: unknown };
		const reported = ITEM_STATUSES.find((candidate) => candidate === body.item?.status);
		if (reported) confirmed = reported;
		if (typeof body.changed === 'boolean') changed = body.changed;
	} catch {
		// A success with an unreadable body is still a success.
	}
	return { ok: true, status: confirmed, changed };
}

/**
 * Whether the list the person is looking at is now out of date: a change that went through moved
 * a row (and may have moved it out of the filter), and a refusal because the row was gone or in
 * another state means the list was already stale. Other refusals leave the list as it was.
 */
export function needsRefresh(result: ChangeStatusResult): boolean {
	if (result.ok) return result.changed;
	return result.kind === 'conflict' || result.kind === 'not_found';
}
