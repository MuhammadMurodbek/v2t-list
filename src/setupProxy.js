const proxy = require('http-proxy-middleware')

module.exports = (app) => {
  var wsProxy = proxy('/socket/', {
    target: 'https://ilxgpu9000.inoviaai.se/audio',
    // target: 'harinder',
    changeOrigin: true, // for vhosted sites, changes host header to match to target's host
    secure: true,
    ws: true, // enable websocket proxy
    logLevel: 'debug'
  });

  app.use(proxy('/api/', { target: 'http://v2t-api:6100', secure: false, changeOrigin: true }))
  // app.use(proxy('/api/', { target: 'https://v2t-dev.inoviaai.se', secure: false, changeOrigin: true }))
  // app.use(proxy('/socket/', { target: 'wss://ilxgpu9000.inoviaai.se', secure: false, changeOrigin: true }))
  // app.use(proxy('/socket/', { target: 'wss://ilxgpu9000.inoviaai.se', ws: true, secure: true, changeOrigin: true  }))
  app.use(wsProxy)
  // app.use(proxy('/api/', { target: 'http://www-v2t-dev.inoviagroup.se/#/', secure: false, changeOrigin: true }))
}
