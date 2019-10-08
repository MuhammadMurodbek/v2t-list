const proxy = require('http-proxy-middleware')

// module.exports = (app) => {
//   app.use(proxy('/api/v1/workflow', { target: 'http://v2t-transcription:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/v2/tickets', { target: 'http://workflow-service:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/v1/tickets', { target: 'http://workflow-service:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/v1/transcription', { target: 'http://v2t-transcription:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/v1/search/icd-10', { target: 'http://v2t-word-spotter:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/v1/v2t-service-realtime/', { target: 'http://v2t-transcription:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/v1/training/', { target: 'http://v2t-transcription:6100/', secure: false, changeOrigin: true }))
//   // app.use(proxy('/api/login/v1/', { target: 'http://v2t-api:6100/', secure: false, changeOrigin: true }))
//   app.use(proxy('/api/login/', { target: 'http://www-v2t-dev/', secure: false, changeOrigin: true }))
// }

module.exports = (app) => {
  app.use(proxy('/api/v1/workflow', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/v2/tickets', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/v1/tickets', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/v1/transcription', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/v1/search/icd-10', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/v1/v2t-service-realtime/', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/v1/training/', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
  app.use(proxy('/api/login', { target: 'http://www-v2t-dev', secure: false, changeOrigin: true }))
}
