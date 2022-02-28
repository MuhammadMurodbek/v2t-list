import axios from 'axios'

const BASE_PATH = '/api/schema/v2'

export const SchemaV2 = {
  find: async function (schemaId) {
    const response = await axios.get(`${BASE_PATH}/id/${schemaId}`)
    return response.data
  },
  findByExternalId: async function (
    channelId,
    externalDepartmentId,
    externalId
  ) {
    // eslint-disable-next-line max-len
    const url = `${BASE_PATH}/external/channel/${channelId}/department/${externalDepartmentId}/id/${externalId}`
    const response = await axios.get(url)
    return response.data
  }
}
