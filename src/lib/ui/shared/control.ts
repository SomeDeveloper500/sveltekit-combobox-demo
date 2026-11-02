import { cx } from './cx';

export type ControlSize = 'sm' | 'md';

/**
 * Shared look of text-like form controls (Input, Select, later Textarea), so a fix lands once.
 * 16px text below `sm` keeps iOS Safari from zooming on focus; `md` is a 44px touch target on mobile.
 * The hover border applies only to a valid control, otherwise it would hide the error border.
 */
export function controlClass(invalid: boolean, size: ControlSize): string {
	return cx(
		'w-full rounded-lg border bg-raised text-base text-fg shadow-xs transition-colors sm:text-sm',
		'disabled:cursor-not-allowed disabled:shadow-none',
		size === 'sm' ? 'min-h-10 sm:min-h-8' : 'min-h-11 sm:min-h-10',
		invalid ? 'border-danger' : 'border-line-strong hover:border-fg-muted'
	);
}

/** Joins aria-describedby id lists, so a caller's own descriptions do not replace the Field wiring. */
export function mergeIds(...ids: (string | null | undefined)[]): string | undefined {
	return ids.filter(Boolean).join(' ') || undefined;
}
