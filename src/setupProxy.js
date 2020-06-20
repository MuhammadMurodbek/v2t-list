/* eslint-disable max-len */
const proxy = require('http-proxy-middleware')

module.exports = (app) => {
  // app.use(proxy('/api/', { target: 'http://v2t-api:6100', secure: false, changeOrigin: true }))
  app.use(proxy('/api/', { target: 'https://v2t-dev.inoviagroup.se/#/', secure: false, changeOrigin: true }))
  // app.use(proxy('/api/', { target: 'http://www-v2t-dev.inoviagroup.se/#/', secure: false, changeOrigin: true }))
}
