const Hapi = require('hapi')
const h2o2 = require('h2o2')
const { baseUrl, frontEndDevPort } = require('./config')

const MB = 1048576

const isDevelopment = process.env.NODE_ENV === 'development'

const init = async () => {
  const server = Hapi.server({
    port: 8080
  })

  await server.register([h2o2])

  const mapApiUri = ({ headers, url }) => {
    const { pathname, search } = url
    const uri = `${baseUrl}${pathname}${search}`
    return { uri, headers: { ...headers, origin: baseUrl } }
  }

  if (isDevelopment) {
    server.route({
      path: '/{param*}',
      method: 'GET',
      handler: {
        proxy: {
          host: 'localhost',
          port: frontEndDevPort,
          protocol: 'http',
          passThrough: true,
          xforward: true
        }
      }
    })
    server.route({
      path: '/api/{param*}',
      method: ['GET'],
      handler: {
        proxy: {
          mapUri: mapApiUri,
          passThrough: true,
          xforward: true
        }
      }
    })
    server.route({
      path: '/api/{param*}',
      method: ['POST', 'PUT', 'DELETE', 'PATCH'],
      config: {
        payload: {
          maxBytes: 7 * MB
        }
      },
      handler: {
        proxy: {
          mapUri: mapApiUri,
          passThrough: true,
          xforward: true
        }
      }
    })
  }

  await server.start()
  // eslint-disable-next-line no-console
  console.log('Server running on http://localhost:%s', server.info.port)
}

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log(err)
  process.exit(1)
})

init()
