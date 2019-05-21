import axios from 'axios'

const retrieveNewId = async () => {
  const idData = await axios({
    method: 'post',
    url: '/api/v1/v2t-realtime/init/',
    data: {},
    contentType: 'application/json'
  })
  return idData
}

export default retrieveNewId
