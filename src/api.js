/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
import axios from 'axios'

const headers = {
  'Content-Type': 'application/json'
}

const URLS = {
  login: '/api/login/v1',
  domains: '/api/login/v1/domains',
  activeTags: '/api/transcription/search/v2/departments',
  searchTranscriptions: '/api/transcription/search/v2',
  keywordsV1: '/api/keywords/v1/',
  transcriptionsV1: '/api/transcriptions/v1',
  trainingTranscript: '/api/training/v2/transcript',
  schemaSearch: '/api/schema/v1/search',
  schemaById: '/api/schema/v1/id',
  searchDepartments: '/api/transcription/search/v2/departments',
  transcriptionV2: '/api/transcription/v2'
}

const setToken = (token) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    axios.defaults.headers.common.Authorization = undefined
  }
}

export const getRedirectURL = () => {
  const searchParams = new URLSearchParams(location.search)
  const redirectUrl = searchParams.get('redirect')

  return redirectUrl
}

export const logout = () => {
  axios.defaults.headers.common.Authorization = undefined
  localStorage.setItem('token', '')

  const redirectUrl = getRedirectURL()
  const encodedUri = encodeURIComponent(location.hash)
  const isRootHash = location.hash === '#/'

  const nextUrl = redirectUrl ||
    isRootHash
    ? location.hash
    : `?redirect=${encodedUri}#/`

  if (isRootHash) {
    window.location.reload()
  }
  else {
    window.location = nextUrl
  }
}

const getDomains = () => axios.get(URLS.domains)

const login = (domain, username, password) => {
  return axios
    .post(
      URLS.login,
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

const loadTags = () => axios.get(URLS.activeTags)

const loadTickets = (department, pageIndex, pageSize, orderBy) => {
  return axios.post(
    URLS.searchTranscriptions,
    {
      department,
      orderBy: orderBy ? [orderBy] : [],
      start: pageIndex * pageSize,
      size: pageSize
    }
  )
}

const keywordsSearch = (searchTerm, namespace = 'icd-10') =>
  axios.post(`${URLS.keywordsV1}${namespace}/search`, {
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

  return axios.post(URLS.transcriptionV2, body)
}
const uploadMediaLive = (
  transcriptionId,
  file,
  schemaId
) => {
  const body = new FormData()
  body.append('media', file)
  const metadataPart = { schemaId }
  // @ts-ignore
  body.set('data', metadataPart)
  return axios.post(`/api/transcription/v2/${transcriptionId}/media`, body)
}

const transcriptState = (transcriptionId) =>
  axios.get(`/api/transcription/v2/${transcriptionId}/state`)

const loadTranscription = (transcriptionId) => {
  return axios.get(`/api/transcription/v2/${transcriptionId}`)
}


const approveTranscription = (transcriptionId) =>
  axios.post(`${URLS.transcriptionV2}/${transcriptionId}/approve`)

const rejectTranscription = (transcriptionId) =>
  axios.post(`${URLS.transcriptionV2}/${transcriptionId}/reject`)

const updateTranscription = (transcriptionId, schemaId, fields) =>
  axios.put(`/api/transcription/v2/${transcriptionId}`, {
    schemaId,
    fields
  })

const updateTranscriptionV2 = (
  transcriptionId,
  doktorsNamn,
  patientsNamn,
  patientsPersonnummer,
  departmentId,
  convertedTranscript,
  schemaId
) => {
  const fields = [
    {
      id: 'doctor_full_name',
      values: [{
        value: doktorsNamn
      }]
    },
    {
      id: 'patient_full_name',
      values: [{
        value: patientsNamn
      }]
    },
    {
      id: 'patient_id',
      values: [{
        value: patientsPersonnummer
      }]
    },
    {
      id: 'department_id',
      values: [{
        value: departmentId
      }]
    }]
  convertedTranscript.forEach(chapter => fields.push(chapter))

  return axios.put(`/api/transcription/v2/${transcriptionId}`, {
    schemaId,
    fields
  })
}

const trainingGetNext = () => axios.get(URLS.trainingTranscript)



const trainingUpdate = (transcriptionId, updatedText) =>
  axios.post(`${URLS.trainingTranscript}/${transcriptionId}/status`, {
    text: updatedText
  })

const trainingReject = (transcriptionId) =>
  axios.post(`${URLS.trainingTranscript}/${transcriptionId}/status`, {
    reject: true
  })

const getSchemas = () => axios.post(URLS.schemaSearch, {
  start: 0,
  size: 1000
})

const getSchema = (id) => axios.get(`${URLS.schemaById}/${id}`)

export { URLS }


const completeLiveTranscript = async (transcriptionId) => {
  await axios.post(`/api/transcription/v2/live/session/${transcriptionId}/complete`)
}

const createLiveSession = async (userId, schemaId, fields = []) => {
  const outcome = await axios.post('/api/transcription/v2/live/session', {
    schemaId,
    userId,
    fields
  })
  return outcome.data.id
}

const getBlobFile = async (recordedAudioClip) => {
  const config = { responseType: 'blob' }
  let file
  await axios.get(recordedAudioClip.src, config).then(response => {
    file = new File([response.data], recordedAudioClip.name, { type: 'audio/wav' })
  })
  return file
}

const getDepartments = () => axios.get('/api/transcription/search/v2/departments')

const getActiveLiveSession = () => axios.get('/api/transcription/v2/live/session/active')

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
  uploadMediaLive,
  // getChartData,
  // getListOfAllJobs,
  getSchemas,
  getSchema,
  createLiveSession,
  updateTranscriptionV2,
  getBlobFile,
  completeLiveTranscript,
  getDepartments,
  transcriptState,
  getActiveLiveSession
}
