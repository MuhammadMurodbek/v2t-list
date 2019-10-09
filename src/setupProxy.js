const proxy = require('http-proxy-middleware')

module.exports = (app) => {
  app.use(proxy('/api/', { target: 'http://v2t-api:6100', secure: false, changeOrigin: true }))
}
