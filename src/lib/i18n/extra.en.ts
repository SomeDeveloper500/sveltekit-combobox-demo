/**
 * English UI strings the provided dictionary (`mocks/i18n.en.json`) does not cover. Same
 * dot-notation keys, `{name}` placeholders are interpolation slots. A string is added in the stage
 * that first uses it. This table is the reference: `extra.de.ts` is typed against it.
 */
export const extraEn = {
	'home.features.1.title': 'Fast by default',
	'home.features.1.body': 'Pages are rendered ahead of time and ship only the code they use.',
	'home.features.2.title': 'Typed end to end',
	'home.features.2.body': 'One schema describes the data on the server, in the URL and in the UI.',
	'home.features.3.title': 'Open to everyone',
	'home.features.3.body':
		'Keyboard friendly, screen reader tested and available in several languages.',
	'home.pricing.title': 'Simple pricing',
	'home.pricing.subtitle': 'Start free and upgrade when your team grows.',
	'home.pricing.perMonth': 'per month',
	'home.pricing.custom': 'Custom',
	'home.pricing.popular': 'Most popular',
	'home.pricing.starter.name': 'Starter',
	'home.pricing.starter.tagline': 'For side projects and trials.',
	'home.pricing.starter.f1': '1 project',
	'home.pricing.starter.f2': 'Community support',
	'home.pricing.starter.f3': 'Basic analytics',
	'home.pricing.team.name': 'Team',
	'home.pricing.team.tagline': 'For teams shipping every week.',
	'home.pricing.team.f1': 'Unlimited projects',
	'home.pricing.team.f2': 'Priority support',
	'home.pricing.team.f3': 'Performance reports',
	'home.pricing.enterprise.name': 'Enterprise',
	'home.pricing.enterprise.tagline': 'For organizations with special needs.',
	'home.pricing.enterprise.f1': 'Single sign-on',
	'home.pricing.enterprise.f2': 'Dedicated support',
	'home.pricing.enterprise.f3': 'Custom agreements',
	'home.proof.title': 'Teams like it',
	'home.proof.disclaimer': 'Sample quotes for this demo.',
	'home.proof.1.quote': 'We cut our page weight in half and stopped arguing about performance.',
	'home.proof.1.author': 'Maria Keller',
	'home.proof.1.role': 'Head of Engineering, Northwind',
	'home.proof.2.quote':
		'The same schema checks our forms, our URLs and our API. Fewer bugs, less glue.',
	'home.proof.2.author': 'Tomasz Nowak',
	'home.proof.2.role': 'Tech Lead, Contoso',
	'site.name': 'Demo Co.',
	'home.meta.description':
		'A performance-first stack for teams that ship: fast pages, clean data and nothing in the way.',
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
