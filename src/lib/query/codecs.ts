import { itemsQuerySchema, postQuerySchema } from '#lib/schemas/query.js';
import { createQueryCodec } from './codec.js';

/** `/dashboard/items?page=…&sort=…&status=…` */
export const itemsQueryCodec = createQueryCodec(itemsQuerySchema);

/** `/search?q=…&tag=…&sort=…` */
export const postQueryCodec = createQueryCodec(postQuerySchema);

/** `/blog?page=…`: the list has no filters, so any other parameter is dropped from its URL. */
export const blogQueryCodec = createQueryCodec(postQuerySchema.pick({ page: true }));
