/**
 * UI strings the provided dictionaries (mocks/i18n.*.json) do not cover. Same dot-notation keys,
 * `{name}` placeholders are interpolation slots. A string is added in the stage that first uses it;
 * the German table is typed against the English one, and a test keeps the two in step.
 */
export const extraEn = {
	'site.name': 'Demo Co.',
	'a11y.skipToContent': 'Skip to main content',
	'a11y.mainNav': 'Main navigation',
	'a11y.language': 'Language',
	'a11y.toggleTheme': 'Dark mode',
	'lang.en': 'English',
	'lang.de': 'Deutsch',
	'error.notFound.title': 'Page not found',
	'error.notFound.body': 'The page you are looking for does not exist or has moved.',
	'error.generic.title': 'Something went wrong',
	'error.generic.body': 'An unexpected error occurred. Please try again in a moment.',
	'error.reference': 'Reference: {id}',
	'error.backHome': 'Back to the home page'
} as const;

export const extraDe: Record<keyof typeof extraEn, string> = {
	'site.name': 'Demo Co.',
	'a11y.skipToContent': 'Zum Hauptinhalt springen',
	'a11y.mainNav': 'Hauptnavigation',
	'a11y.language': 'Sprache',
	'a11y.toggleTheme': 'Dunkelmodus',
	'lang.en': 'English',
	'lang.de': 'Deutsch',
	'error.notFound.title': 'Seite nicht gefunden',
	'error.notFound.body': 'Die gesuchte Seite existiert nicht oder wurde verschoben.',
	'error.generic.title': 'Etwas ist schiefgelaufen',
	'error.generic.body':
		'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es gleich noch einmal.',
	'error.reference': 'Referenz: {id}',
	'error.backHome': 'Zurück zur Startseite'
};
