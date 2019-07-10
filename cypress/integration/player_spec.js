/* eslint-disable no-undef */
describe('Check player component', () => {
  it('Load initial page', () => {
    cy.visit('http://localhost:3000')
    cy.wait(1000)
  })

  it('Open a transcript', () => {
    cy.contains('Open').click()
    cy.wait(1000)
  })

  it('Check initial time setup', () => {
    cy.get('span.tidPunkt').contains('00:00/')
    cy.wait(1000)
  })

  it('Stop the transcript', () => {
    cy.get('button#stop').click()
    cy.wait(1000)
  })

  it('Play it again', () => {
    cy.get('button#play').click()
    cy.wait(1000)
  })

  it('Pause the transcript', () => {
    cy.get('button#pause').click()
    cy.wait(1000)
  })

  it('Play it again', () => {
    cy.get('button#play').click()
    cy.wait(1000)
  })

  it('Go forward', () => {
    cy.get('button#forward').click()
    cy.wait(1000)
  })

  it('Go forward again', () => {
    cy.get('button#forward').click()
    cy.wait(1000)
  })

  it('Go backward', () => {
    cy.get('button#backward').click()
    cy.wait(1000)
  })

  it('Go backward again', () => {
    cy.get('button#backward').click()
    cy.wait(1000)
  })

  it('Go to training page', () => {
    cy.visit('http://localhost:3000/#/training')
    cy.wait(1000)
  })

  it('Check initial time setup', () => {
    cy.get('span.tidPunkt').contains('00:00/')
    cy.wait(1000)
  })

  it('Stop the transcript', () => {
    cy.get('button#stop').click()
    cy.wait(1000)
  })

  it('Play it again', () => {
    cy.get('button#play').click()
    cy.wait(1000)
  })

  it('Pause the transcript', () => {
    cy.get('button#pause').click()
    cy.wait(1000)
  })

  it('Play it again', () => {
    cy.get('button#play').click()
    cy.wait(1000)
  })

  it('Go forward', () => {
    cy.get('button#forward').click()
    cy.wait(1000)
  })

  it('Go forward again', () => {
    cy.get('button#forward').click()
    cy.wait(1000)
  })

  it('Go backward', () => {
    cy.get('button#backward').click()
    cy.wait(1000)
  })

  it('Go backward again', () => {
    cy.get('button#backward').click()
    cy.wait(1000)
  })
})
