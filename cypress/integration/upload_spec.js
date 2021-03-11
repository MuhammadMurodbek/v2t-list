// /* eslint-disable no-undef */
// describe('Upload an audio file', () => {
//   it('Go to home page', () => {
//     cy.visit('http://localhost:3000')
//     cy.wait(1000)
//   })
//   it('Go to upload page', () => {
//     cy.visit('http://localhost:3000/#/upload')
//     cy.wait(1000)
//   })

//   Cypress.Commands.add('dropFile', { prevSubject: false }, (fileName) => {
//     Cypress.log({ name: 'dropFile' })
//     return cy
//       .fixture(fileName, 'base64')
//       .then(Cypress.Blob.base64StringToBlob)
//       .then((blob) => {
//         // instantiate File from `application` window, not cypress window
//         return cy.window().then((win) => {
//           const file = new win.File([blob], fileName)
//           const dataTransfer = new win.DataTransfer()
//           dataTransfer.items.add(file)
//           return cy.document().trigger('drop', { dataTransfer })
//         })
//       })
//   })

//   it('Uploads a CSV', () => {
//     cy.document().trigger('dragenter')
//     // you don't need to use cy.document() 
// that is where my event listener is.
//     // you could use cy.get('element').trigger('dragenter')
//     cy.dropFile('/Users/reza/Downloads/voice-recording.png')
//   })
// })
