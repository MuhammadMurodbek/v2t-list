const proxy = require('http-proxy-middleware')

module.exports = (app) => {
  app.use(proxy('/api/v1/workflow', { target: 'http://v2t-service:6100/', secure: false, cahngeOrigin: true }))
  app.use(proxy('/api/v1/transcription', { target: 'http://v2t-service:6100/', secure: false, cahngeOrigin: true }))
  app.use(proxy('/api/v1/transcription', { target: 'http://v2t-service:6100/', secure: false, cahngeOrigin: true }))
  // app.use(proxy('/api/v1/v2t-realtime', { target: 'http://v2t-service:6100/', secure: false, cahngeOrigin: true }))
  app.use(proxy('/api/v1/code-service', { target: 'http://code-service:7004/', secure: false, cahngeOrigin: true }))
  app.use(proxy('/api/v1/v2t-realtime', { target: 'http://realtime-service:6100/', secure: false, cahngeOrigin: true }))
}


