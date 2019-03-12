const proxy = require('http-proxy-middleware')

module.exports = (app) => {
  // app.use(proxy('/api', { target: 'http://storage-service:6100/', secure: false, cahngeOrigin: true }))
  app.use(proxy('/api', { target: 'http://v2t-service:6100/', secure: false, cahngeOrigin: true }))
}
