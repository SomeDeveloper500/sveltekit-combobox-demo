import { itemsQuerySchema, postQuerySchema } from '#lib/schemas/query.js';
import { createQueryCodec } from './codec.js';

/** `/dashboard/items?page=…&sort=…&status=…` */
export const itemsQueryCodec = createQueryCodec(itemsQuerySchema);

/** `/blog?page=…` and `/search?q=…&tag=…&sort=…` */
export const postQueryCodec = createQueryCodec(postQuerySchema);
