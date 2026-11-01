/** Joins class names, skipping falsy values. Small enough that we do not need clsx. */
export function cx(...parts: (string | false | null | undefined)[]): string {
	return parts.filter(Boolean).join(' ');
}
