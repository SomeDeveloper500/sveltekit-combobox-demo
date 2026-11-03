// Relative, with the extension: this file also runs in the edge function (Deno), which knows
// neither the `#lib` alias nor extensionless imports.
import { rumPayloadSchema, type RumEvent } from '../rum/schema.ts';

/** Far more than a batch of 20 events needs; anything bigger is not ours. */
export const MAX_BODY_BYTES = 32 * 1024;

type Log = { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

export type Receipt = { status: 204 | 400 | 413 | 415 };

/** One line per event, as JSON, so a log pipeline can parse it and a visitor's text cannot forge a line. */
export function logEvent(event: RumEvent, log: Log = console): void {
	if (event.type === 'vital') {
		log.info('[rum] vital', JSON.stringify(event));
	} else {
		log.error('[rum] client error', JSON.stringify(event));
	}
}

/**
 * Takes a beacon: checks its size and its shape, then hands every event on. The endpoint console-logs
 * them; a real deployment would forward them to a metrics store and an error tracker from here.
 * A body that is not what the page sends is refused whole, never half-used.
 */
export async function receiveBeacon(request: Request, log: Log = console): Promise<Receipt> {
	// `sendBeacon` with a Blob keeps its type; a plain-text beacon is accepted too.
	const type = request.headers.get('content-type') ?? '';
	if (!type.includes('application/json') && !type.includes('text/plain')) return { status: 415 };

	const declared = Number(request.headers.get('content-length') ?? 0);
	if (declared > MAX_BODY_BYTES) return { status: 413 };

	let text: string;
	try {
		text = await request.text();
	} catch {
		return { status: 400 };
	}
	if (text.length > MAX_BODY_BYTES) return { status: 413 };

	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch {
		return { status: 400 };
	}

	const parsed = rumPayloadSchema.safeParse(body);
	if (!parsed.success) return { status: 400 };

	for (const event of parsed.data.events) logEvent(event, log);
	return { status: 204 };
}
