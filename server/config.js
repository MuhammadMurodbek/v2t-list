const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'https://v2t-dev.inoviagroup.se/api'
    : ''

const frontEndDevPort = 13388
module.exports = { baseUrl, frontEndDevPort }
