import { z } from 'zod';
import { slugSchema } from './common';

import { ITEM_CHANNELS, ITEM_STATUSES } from './lists';

// The lists live in `lists.ts`, free of Zod; pages that only show the options import them from there.
export { ITEM_CHANNELS, ITEM_STATUSES, type ItemChannel, type ItemStatus } from './lists';

export const itemStatusSchema = z.enum(ITEM_STATUSES);
export const itemChannelSchema = z.enum(ITEM_CHANNELS);

/** A dashboard row (a campaign). The source of truth for the table, the edit form and the API. */
export const itemSchema = z
	.object({
		id: z.string().min(1),
		name: z.string().min(1),
		status: itemStatusSchema,
		channel: itemChannelSchema,
		owner: z.object({ id: z.string().min(1), name: z.string().min(1) }),
		budget: z.number().nonnegative(),
		spent: z.number().nonnegative(),
		impressions: z.number().int().nonnegative(),
		clicks: z.number().int().nonnegative(),
		ctr: z.number().min(0).max(1),
		startDate: z.iso.date(),
		endDate: z.iso.date(),
		updatedAt: z.iso.datetime(),
		tags: z.array(slugSchema)
	})
	// ISO dates compare correctly as strings.
	.refine((item) => item.endDate >= item.startDate, {
		path: ['endDate'],
		message: 'endDate must not be before startDate'
	});
export type Item = z.infer<typeof itemSchema>;

/** Payload of the inline status edit; shared by the client form and the server action. */
export const updateStatusSchema = z.object({
	id: z.string().min(1),
	status: itemStatusSchema
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
