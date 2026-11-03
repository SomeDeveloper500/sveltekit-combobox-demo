// What the page and the server agree on, in a file that imports nothing: the page's own collector
// needs these values, and must not pull the validation library (`schema.ts`) into the JavaScript
// of every page just to know them.

/** The four metrics the beacon carries. */
export const VITAL_NAMES = ['LCP', 'INP', 'CLS', 'TTFB'] as const;

/** Where on the page an error was caught. */
export const ERROR_SOURCES = ['boundary', 'hook', 'window', 'promise'] as const;

/** The most events one beacon may carry. */
export const MAX_EVENTS = 20;
