import { getContext, setContext } from 'svelte';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export type Toast = {
	id: number;
	tone: ToastTone;
	title?: string;
	message: string;
	/** Milliseconds before it closes on its own; 0 keeps it until dismissed. */
	duration: number;
};

export type ToastInput = {
	tone?: ToastTone;
	title?: string;
	message: string;
	duration?: number;
};

const MAX_VISIBLE = 5;
const DEFAULT_DURATION = 5000;

/**
 * Toast queue on runes. It is created per app instance and shared through context
 * (`provideToasts` / `getToasts`), never as a module-level singleton: on the server a singleton
 * would be shared by every request.
 */
export class ToastStore {
	items = $state<Toast[]>([]);
	#nextId = 1;

	add(input: ToastInput): number {
		const toast: Toast = {
			id: this.#nextId++,
			tone: input.tone ?? 'info',
			title: input.title,
			message: input.message,
			duration: input.duration ?? DEFAULT_DURATION
		};
		this.items = [...this.items, toast].slice(-MAX_VISIBLE);
		return toast.id;
	}

	dismiss(id: number): void {
		this.items = this.items.filter((toast) => toast.id !== id);
	}

	clear(): void {
		this.items = [];
	}
}

const key = Symbol('toasts');

/** Creates the store and exposes it to the component subtree. Call once, in the root layout. */
export function provideToasts(): ToastStore {
	return setContext(key, new ToastStore());
}

export function getToasts(): ToastStore {
	const store = getContext<ToastStore | undefined>(key);
	if (!store) throw new Error('getToasts() needs provideToasts() in a parent component');
	return store;
}
