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

const loadTickets = (tag, pageIndex, pageSize) => {
  let tagParams = ''
  if (tag) {
    tagParams = `&tags=${tag}`
  }
  return axios.get(
    `/api/tickets/v1?pageStart=${
      pageIndex * pageSize
    }&pageSize=${pageSize}${tagParams}`
  )
}

const keywordsSearch = (searchTerm, namespace = 'icd-10') =>
  axios.post(`/api/keywords/v1/${namespace}/search`, {
    text: searchTerm
  })

const uploadMedia = (
  file,
  metadata,
  selectedJob,
  patientsnamn,
  patientnummer,
  doktorsnamn,
  avdelning,
  selectedSchema,
  selectedJournalSystem
) => {
  const body = new FormData()
  body.append('media', file)
  let metadataPart
  if (metadata) {
    if (metadata !== 'norwegian') { 
      metadataPart = new Blob(
        [
          JSON.stringify({
            transcription: {
              model: metadata,
              tags: [selectedJob],
              language: 'sv',
              fields: {
                department_id: 'Inovia',
                department_name: avdelning,
                examination_time: '2019-11-06T03:29:33.344Z',
                doctor_id: doktorsnamn,
                doctor_first_name: '',
                doctor_last_name: '',
                doctor_full_name: doktorsnamn,
                patient_id: patientnummer,
                patient_full_name: patientsnamn
              }
            },
            word_spotter: {
              section_template: selectedSchema,
              categories: ['icd-10', 'kva']
            },
            export: [
              {
                system_id: selectedJournalSystem
              }
            ]
          })
        ],
        {
          type: 'application/json'
        }
      )
    } else {
      metadataPart = new Blob(
        [
          JSON.stringify({
            transcription: {
              model: metadata,
              tags: [selectedJob],
              language: 'sv',
              fields: {
                department_id: 'Inovia',
                department_name: avdelning,
                examination_time: '2019-11-06T03:29:33.344Z',
                doctor_id: doktorsnamn,
                doctor_first_name: '',
                doctor_last_name: '',
                doctor_full_name: doktorsnamn,
                patient_id: patientnummer,
                patient_full_name: patientsnamn
              }
            },
            word_spotter: {
              section_template: 'norwegian',
              categories: ['icd-10', 'kva']
            },
            export: [
              {
                system_id: selectedJournalSystem
              }
            ]
          })
        ],
        {
          type: 'application/json'
        }
      )
    }
    body.set('metadata', metadataPart)
  }

  return axios.post('/api/transcriptions/v1', body)
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
  getSchema
}
