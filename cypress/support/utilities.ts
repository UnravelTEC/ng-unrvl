export const prefixBaseUrl = (url: string) => Cypress.config('baseUrl') + url;

export const cySelector = (selector: string) => `[data-cy=${selector}]`;
