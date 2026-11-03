import type { Metric } from 'web-vitals';
import { ErrorBudget, sampled } from './sampling';
import { MAX_EVENTS, VITAL_NAMES, type ERROR_SOURCES } from './schema';
import type { ErrorEvent, RumEvent, VitalEvent } from './schema';

export type ErrorSource = (typeof ERROR_SOURCES)[number];

/** Sends a body and says whether it was handed off. Never throws. */
export type Transport = (url: string, body: string) => boolean;

/**
 * `sendBeacon` survives the page closing, which is when the final CLS and INP are known. Where it
 * is missing or refuses (a full queue), a `keepalive` fetch makes the same promise.
 */
export const beacon: Transport = (url, body) => {
	try {
		if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return true;
	} catch {
		// fall through to fetch
	}
	try {
		void fetch(url, {
			method: 'POST',
			body,
			keepalive: true,
			headers: { 'content-type': 'application/json' }
		}).catch(() => {});
		return true;
	} catch {
		return false;
	}
};

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

/** What an error says about itself, whatever was thrown. */
function describe(error: unknown): { message: string; stack?: string } {
	if (error instanceof Error) return { message: error.message || error.name, stack: error.stack };
	if (typeof error === 'string') return { message: error };
	try {
		return { message: JSON.stringify(error) ?? String(error) };
	} catch {
		return { message: String(error) };
	}
}

export type RumOptions = {
	endpoint: string;
	/** Share of page loads that report vitals, 0 to 1. Errors are not sampled: each one matters. */
	sampleRate: number;
	path?: () => string;
	transport?: Transport;
	random?: () => number;
	/** How many distinct errors one page may report. */
	errorLimit?: number;
	/** Where `error`, `unhandledrejection` and `pagehide` are heard; the window, unless a test says otherwise. */
	target?: EventTarget;
};

export type Rum = {
	/** Whether this page load is in the vitals sample. */
	readonly sampled: boolean;
	vital(metric: Pick<Metric, 'name' | 'value' | 'rating' | 'id' | 'navigationType'>): void;
	error(error: unknown, source: ErrorSource, id?: string): void;
	/** Sends what has been collected. Safe to call any number of times. */
	flush(): void;
};

/**
 * The collector behind the beacon. Vitals are held (the latest value per metric: CLS and INP
 * revise themselves) until the page is hidden or closing, then sent in one batch. Errors are sent
 * at once, deduplicated and capped, because a page that crashed may not live to a later flush.
 * Nothing here throws: reporting must never be the thing that breaks the page.
 */
export function createRum({
	endpoint,
	sampleRate,
	path = () => location.pathname,
	transport = beacon,
	random = Math.random,
	errorLimit = 5
}: RumOptions): Rum {
	const inSample = sampled(sampleRate, random);
	// A metric's id names one page load, so its path is the page that load began on; client-side
	// navigation does not start a new load, and must not move a metric to another page.
	const landing = path();
	const budget = new ErrorBudget(errorLimit);
	const vitals = new Map<string, VitalEvent>();
	const errors: ErrorEvent[] = [];

	function send(events: RumEvent[]) {
		for (let start = 0; start < events.length; start += MAX_EVENTS) {
			transport(endpoint, JSON.stringify({ events: events.slice(start, start + MAX_EVENTS) }));
		}
	}

	function flush() {
		const events: RumEvent[] = [...errors, ...vitals.values()];
		if (events.length === 0) return;
		errors.length = 0;
		vitals.clear();
		send(events);
	}

	return {
		sampled: inSample,
		vital(metric) {
			if (!inSample) return;
			const name = VITAL_NAMES.find((candidate) => candidate === metric.name);
			if (!name) return;
			vitals.set(name, {
				type: 'vital',
				name,
				value: metric.value,
				rating: metric.rating,
				id: clip(metric.id, 64),
				navigationType: metric.navigationType,
				path: clip(landing, 200)
			});
		},
		error(error, source, id) {
			try {
				const { message, stack } = describe(error);
				if (!budget.admit(`${source}:${message}`)) return;
				errors.push({
					type: 'error',
					source,
					message: clip(message || 'Unknown error', 500),
					stack: stack ? clip(stack, 4000) : undefined,
					id: id ? clip(id, 64) : undefined,
					path: clip(path(), 200)
				});
				flush();
			} catch {
				// reporting must not throw
			}
		},
		flush
	};
}

let current: Rum | null = null;

/** Reports an error from anywhere on the client (hooks, boundaries). A no-op until `startRum` ran. */
export function reportError(error: unknown, source: ErrorSource, id?: string): void {
	current?.error(error, source, id);
}

/**
 * Wires the page up: the error listeners at once, the web-vitals observers when the browser is
 * idle (they are not needed to paint, and must not compete with it), and a flush whenever the page
 * is hidden or closing. Returns a function that undoes the listeners.
 */
export function startRum(options: RumOptions): () => void {
	const target = options.target ?? window;
	const rum = createRum(options);
	current = rum;

	const onError = (event: Event) => {
		const { error, message } = event as unknown as { error?: unknown; message?: string };
		rum.error(error ?? message ?? 'Unknown error', 'window');
	};
	const onRejection = (event: Event) =>
		rum.error((event as PromiseRejectionEvent).reason, 'promise');
	const onVisibility = () => {
		if (document.visibilityState === 'hidden') rum.flush();
	};
	const onPageHide = () => rum.flush();

	target.addEventListener('error', onError);
	target.addEventListener('unhandledrejection', onRejection);
	target.addEventListener('pagehide', onPageHide);
	document.addEventListener('visibilitychange', onVisibility);

	if (rum.sampled) {
		const observe = async () => {
			try {
				const { onCLS, onINP, onLCP, onTTFB } = await import('web-vitals');
				for (const observer of [onLCP, onINP, onCLS, onTTFB]) observer(rum.vital);
			} catch {
				// a blocked or failed chunk costs the metrics, never the page
			}
		};
		if ('requestIdleCallback' in window) requestIdleCallback(() => void observe());
		else setTimeout(() => void observe(), 1);
	}

	return () => {
		target.removeEventListener('error', onError);
		target.removeEventListener('unhandledrejection', onRejection);
		target.removeEventListener('pagehide', onPageHide);
		document.removeEventListener('visibilitychange', onVisibility);
		if (current === rum) current = null;
	};
}
