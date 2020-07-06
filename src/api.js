/* eslint-disable no-console */
import axios from 'axios'

const headers = {
  'Content-Type': 'application/json'
}

const setToken = (token) => {
  if (token !== '') {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    axios.defaults.headers.common.Authorization = undefined
  }
}

const logout = () => {
  axios.defaults.headers.common.Authorization = undefined
  localStorage.setItem('token', '')
  window.location.replace('/')
}

const getDomains = () => axios.get('/api/login/v1/domains')

const login = (domain, username, password) => {
  return axios
    .post(
      '/api/login/v1',
      {
        domain,
        username,
        password
      },
      {
        headers
      }
    )
    .then((response) => {
      setToken(response.data.token)
      return response.data.token
    })
}

const loadTags = () => axios.get('/api/tickets/v1/tags/active')

const loadTickets = (department, pageIndex, pageSize, orderBy) => {
  return axios.post(
    '/api/transcription/search/v2',
    {
      department,
      orderBy: orderBy ? [orderBy] : [],
      start: pageIndex * pageSize,
      size: pageSize
    }
  )
}

const keywordsSearch = (searchTerm, namespace = 'icd-10') =>
  axios.post(`/api/keywords/v1/${namespace}/search`, {
    text: searchTerm
  })

const uploadMedia = (
  file,
  schemaId,
  fields
) => {
  const body = new FormData()
  body.append('media', file)

  const data = new Blob(
    [
      JSON.stringify({
        schemaId,
        fields: [
          ...Object.keys(fields)
            .filter(id => fields[id])
            .map(id => ({
              id,
              values: [
                {
                  value: fields[id]
                }
              ]
            }))
        ]
      })
    ],
    {
      type: 'application/json'
    }
  )
  body.set('data', data)

  return axios.post('/api/transcription/v2', body)
}

const loadTranscription = (transcriptionId) =>
  axios.get(`/api/transcriptions/v1/${transcriptionId}`)

const approveTranscription = (transcriptionId) =>
  axios.post(`/api/transcriptions/v1/${transcriptionId}/approve`)

const rejectTranscription = (transcriptionId) =>
  axios.post(`/api/transcriptions/v1/${transcriptionId}/reject`)

const updateTranscription = (transcriptionId, tags, chapters, schemaId) =>
  axios.put(`/api/transcriptions/v1/${transcriptionId}`, {
    tags,
    transcriptions: chapters,
    schemaId
  })

const trainingGetNext = () => axios.get('/api/training/v2/transcript')

const trainingUpdate = (transcriptionId, updatedText) =>
  axios.post(`/api/training/v2/transcript/${transcriptionId}/status`, {
    text: updatedText
  })

const trainingReject = (transcriptionId) =>
  axios.post(`/api/training/v2/transcript/${transcriptionId}/status`, {
    reject: true
  })

const getSchemas = () => axios.post('/api/schema/v1/search', {
  start: 0,
  size: 1000
})

const getSchema = (id) => axios.get(`/api/schema/v1/id/${id}`)

const getChartData = () => axios.get('/api/charts/v1/CHART_ID')

const getListOfAllJobs = () =>
  axios.post('/api/import/v1/search', {
    source: 'MED_SPEECH'
  })

const getDepartments = () => axios.get('/api/transcription/search/v2/departments')

export default {
  approveTranscription,
  rejectTranscription,
  setToken,
  keywordsSearch,
  getDomains,
  login,
  loadTags,
  loadTickets,
  loadTranscription,
  logout,
  trainingGetNext,
  trainingReject,
  trainingUpdate,
  updateTranscription,
  uploadMedia,
  getChartData,
  getListOfAllJobs,
  getSchemas,
  getSchema,
  getDepartments
}
