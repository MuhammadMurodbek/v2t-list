/* eslint-disable no-undef */
describe('Training', () => {
  it('Go to home page', () => {
    cy.visit('http://localhost:3000')
    cy.wait(1000)
  })
  it('Go to training page', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.visit('http://localhost:3000/#/training')
    cy.wait(1000)
  })
  it('Pause the transcript', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.get('button#pause').click()
    cy.wait(1000)
  })
  it('Show Preview', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('span.euiButtonEmpty__text').click()
    cy.wait(1000)
  })
  it('Edit training data', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('span.editorBody').last().click().type(' sample text . ')
    cy.wait(1000)
  })
  it('Use punctuation', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('span.editorBody').last().click().type(' , :  ')
    cy.wait(1000)
  })
  it('Hide Preview', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('span.euiButtonEmpty__text').click()
    cy.wait(1000)
  })
  it('Check the instructions', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.contains('Användarguide').click()
    cy.wait(1000)
  })

  it('Get back to previous tab', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.contains('Snabb Kommandon').click()
    cy.wait(1000)
  })

  it('Stop auto-play feature', () => {
    cy.wait(1000)
    cy.get('svg.gear').first().click()
    cy.get('div.euiFlyoutBody').scrollTo(0, 500)
    cy.wait(1000)
    cy.get('div.autoplaySwitch').click()
    cy.wait(1000)
    cy.get('button.euiFlyout__closeButton').click()
    cy.wait(1000)
  })

  it('Check another training data', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('button.skip').click()
    cy.wait(1000)
  })

  it('Reject training data', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('button.reject').click()
    cy.wait(1000)
  })

  it('Complete training data', () => {
    cy.contains('Training').scrollIntoView({ easing: 'linear' })
    cy.wait(1000)
    cy.get('button.complete').click()
    cy.wait(1000)
  })
})
