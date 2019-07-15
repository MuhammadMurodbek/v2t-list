

/* eslint-disable no-undef */
describe('Check page loading', () => {
  it('Loading Home Page', () => {
    cy.visit('http://localhost:3000')
    cy.wait(1000)
  })

  it('Loading live transcript', () => {
    cy.visit('http://localhost:3000/#/live')
    cy.wait(1000)
  })
  it('Get back to the home page', () => {
    cy.visit('http://localhost:3000')
    cy.wait(1000)
  })
  it('Loading upload page', () => {
    cy.visit('http://localhost:3000/#/upload')
    cy.wait(1000)
  })
  it('Loading analytics page', () => {
    cy.visit('http://localhost:3000/#/training')
    cy.wait(1000)
  })
  it('Loading training page', () => {
    cy.visit('http://localhost:3000/#/training')
    cy.wait(1000)
  })
  it('Loading Home Page', () => {
    cy.visit('http://localhost:3000')
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
