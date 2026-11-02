import type { LayoutLoad } from './$types';

/** The locale segment, already validated by the `locale` param matcher, handed to every page. */
export const load: LayoutLoad = ({ params }) => ({ lang: params.lang });
