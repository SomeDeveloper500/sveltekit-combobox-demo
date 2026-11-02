import type { Translate } from './translate';

/**
 * The words a `Combobox` shows and announces, in the page language. The component ships English
 * defaults and knows nothing about translation, so every use spreads this into its props.
 */
export function comboboxLabels(t: Translate) {
	return {
		clearLabel: t('combobox.clear'),
		noResultsLabel: t('combobox.noResults'),
		resultsLabel: (count: number) =>
			count === 1 ? t('combobox.resultOne') : t('combobox.results', { count })
	};
}
