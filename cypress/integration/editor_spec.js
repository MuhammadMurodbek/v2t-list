/* eslint-disable no-undef */
describe('Check editor component', () => {
  it('Load initial page', () => {
    cy.visit('http://localhost:3000')
    cy.wait(1000)
  })

  it('Open a transcript', () => {
    cy.contains('Open').click()
    cy.wait(1000)
  })

  it('Check whether the editor contains the transcript', () => {
    cy.get('span.editorBody')
    cy.wait(1000)
  })

  it('Check whether the text in the editor is editable', () => {
    cy.get('span.editorBody').first().click()
    cy.wait(1000)
  })

  it('Wait and see', () => {
    cy.wait(5000)
    cy.get('span.editorBody').last().click()
    cy.wait(1000)
  })

//   it('Start typing at first', () => {
//     cy.wait(5000)
//     cy.get('span.editorBody').first().click().type(' sample words ')
//     cy.wait(1000)
//   })

  it('Start typing at the end', () => {
    cy.wait(5000)
    cy.get('span.editorBody').last().type(' sample words ')
    cy.wait(1000)
  })
  // Edit 
  // Check Karaoke
  // Update
  // Go to home page
  // Back to transcript 
  // Run Karaoke 
  // Check Cancel
  // Check submit to coworker
})
