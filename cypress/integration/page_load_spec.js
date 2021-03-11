/* eslint-disable no-undef */

/*
  use cypress.env.json as the configuration file in the root folder.
  Sample configuration
  {
    "host": "http://localhost:3000/"
  }
  Environment variable documentation for Cypress:
  https://docs.cypress.io/guides/
  guides/environment-variables.html#Option-2-cypress-env-json
*/

describe('Check page loading', () => {
  it('Loading Home Page', () => {
    cy.visit(Cypress.env('host'))
    cy.wait(1000)
  })

  it('Loading live transcript', () => {
    cy.visit(`${Cypress.env('host')}#/live`)
    cy.wait(1000)
  })
  it('Get back to the home page', () => {
    cy.visit(Cypress.env('host'))
    cy.wait(1000)
  })
  it('Loading upload page', () => {
    cy.visit(`${Cypress.env('host')}#/upload`)
    cy.wait(1000)
  })
  it('Loading training page', () => {
    cy.visit(`${Cypress.env('host')}#/training`)
    cy.wait(1000)
  })
  it('Loading Home Page', () => {
    cy.visit(Cypress.env('host'))
    cy.wait(1000)
  })
  it('Presence of a list', () => {
    cy.contains('Created')
    cy.contains('Type')
    cy.contains('Doctor name')
    cy.wait(1000)
  })
  it('Presence of a transcript', () => {
    cy.contains('Open').click()
    cy.wait(1000)
  })
})
