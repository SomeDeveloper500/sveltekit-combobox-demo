import { z } from 'zod';
import { hexColorSchema, localeSchema, slugSchema } from './common';

export const translationSchema = z.object({
	title: z.string().min(1),
	excerpt: z.string(),
	body: z.string().min(1)
});
export type Translation = z.infer<typeof translationSchema>;

/** A post carries a translation for every supported locale; a missing one is a data error. */
export const postSchema = z.object({
	id: z.string().min(1),
	slug: slugSchema,
	translations: z.record(localeSchema, translationSchema),
	tags: z.array(slugSchema),
	author: z.object({ id: z.string().min(1), name: z.string().min(1), avatarColor: hexColorSchema }),
	publishedAt: z.iso.datetime(),
	readingTimeMinutes: z.number().int().positive(),
	coverColor: hexColorSchema
});
export type Post = z.infer<typeof postSchema>;

export const tagSchema = z.object({
	slug: slugSchema,
	label: z.record(localeSchema, z.string().min(1))
});
export type Tag = z.infer<typeof tagSchema>;
