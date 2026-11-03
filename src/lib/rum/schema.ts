import { z } from 'zod';

/** The four metrics the beacon carries. */
export const VITAL_NAMES = ['LCP', 'INP', 'CLS', 'TTFB'] as const;

/** Where on the page an error was caught. */
export const ERROR_SOURCES = ['boundary', 'hook', 'window', 'promise'] as const;

/** The most events one beacon may carry. */
export const MAX_EVENTS = 20;

// The path only, never the query: a URL can carry a search term or a token.
const path = z
	.string()
	.max(200)
	.regex(/^\/[^?#]*$/, 'expected a path without query or fragment');

export const vitalEventSchema = z.object({
	type: z.literal('vital'),
	name: z.enum(VITAL_NAMES),
	value: z.number().finite().min(0).max(600_000),
	rating: z.enum(['good', 'needs-improvement', 'poor']),
	id: z.string().min(1).max(64),
	navigationType: z.string().max(32).optional(),
	path
});

export const errorEventSchema = z.object({
	type: z.literal('error'),
	source: z.enum(ERROR_SOURCES),
	message: z.string().min(1).max(500),
	stack: z.string().max(4000).optional(),
	/** The reference shown to the visitor, so a report can be matched to a screenshot. */
	id: z.string().max(64).optional(),
	path
});

/** What the page sends, in one beacon: a batch, because the page is often closing. */
export const rumPayloadSchema = z.object({
	events: z
		.array(z.discriminatedUnion('type', [vitalEventSchema, errorEventSchema]))
		.min(1)
		.max(MAX_EVENTS)
});

export type VitalEvent = z.infer<typeof vitalEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type RumEvent = VitalEvent | ErrorEvent;
export type RumPayload = z.infer<typeof rumPayloadSchema>;
