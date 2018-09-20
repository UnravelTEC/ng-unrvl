/**
 * NOTE: this file does not have any imports or the namespace typings does not work
 */

/**
 * TODO: Starting with Typescript 2.8.0 with should use ReturnType<fn> here
 */
declare namespace Cypress {
  interface Chainable<Subject> {
    getByCyData(selector: string, options?: { timeout: number }): Cypress.Chainable<JQuery<HTMLElement>>;
  }
}

Cypress.Commands.add('getByCyData', getByCyDataFn);

function getByCyDataFn(selector: string, options?: { timeout: number }) {
  return cy.get(`[data-cy=${selector}]`, options);
}
