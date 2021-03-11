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
    cy.wait(1000)
    cy.get('span.editorBody').last().type(' sample text.')
    cy.wait(1000)
  })

  //   it('Start typing at first', () => {
  //     cy.wait(5000)
  //     cy.get('span.editorBody').first().click().type(' sample words ')
  //     cy.wait(1000)
  //   })

  it('Start typing at the end', () => {
    // cy.wait(5000)
    cy
      .get('span.editorBody')
      .last()
      .type('{enter}')
      .type('Lungor')
      .get('span.editorBody')
      .last()

      
    
    // cy
    // .get('span.editorBody')
    // .nextAll()
    // .type('sss')

    // cy
    //   .get('span.editorBody')
    //   .next()
    //   .type('Hellos')
    //   .tab()
    //   .type('Hello')
    cy.wait(1000)
  })


  it('Cancel editing', () => {
    // cy.wait(5000)
    cy
      .contains('Cancel')
      .click()
    
    cy.get('button#pause').click()
  })

  // it('Start typing at the end', () => {
  //   // cy.wait(5000)
  //   cy
  //     .get('span.editorBody')
  //     .last()
  //     .type('{enter}')
  //     .type('Lungor')
  //     .get('span.editorBody')
  //     .last()

  //   cy
  //     .contains('Cancel')
  //     .click()


  // ”Allmän Tillstånd: Gott och opåverkad.Inga 
  // kardiella inkompensationstecken i vila.Pollenallergiker.
  //   Lungor: Rena andningsljud.Inga rassel eller ronki.
  //     Buk: Palperas mjuk och oöm.Inga patologiska resistenser.”

  // Diagnos: J30.1
  // it('Create a header', () => {
  //   cy.wait(5000)
  //   cy.get('span.editorBody').last().type('\n').type('hello man')
  //   cy.wait(1000)
  // })
  // Edit 
  // Check Karaoke
  // Update
  // Go to home page
  // Back to transcript 
  // Run Karaoke 
  // Check Cancel
  // Check submit to coworker
})
