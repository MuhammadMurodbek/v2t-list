const proxy = require('http-proxy-middleware')

module.exports = (app) => {
  app.use(proxy('/api', { target: 'http://storage-service:6100/', secure: false, cahngeOrigin: true }))
}
