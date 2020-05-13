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

const login = (username, password) => {
  return axios.post('/api/login/v1', {
    username,
    password
  }, {
    headers
  })
    .then((response) => {
      setToken(response.data.token)
      return response.data.token
    })
}

const loadTags = () => {
  return axios.get('/api/tickets/v1/tags/active')
    .then(response => response.data)
    .catch((error) => {
      logout()
    })
}

const loadTickets = (tag, pageIndex, pageSize) => {
  let tagParams = ''
  if (tag) {
    tagParams = `&tags=${tag}`
  }
  return axios.get(`/api/tickets/v1?pageStart=${pageIndex*pageSize}&pageSize=${pageSize}${tagParams}`)
    .then(response => response.data)
    .catch((error) => {
      logout()
    })
}

const keywordsSearch = (searchTerm, namespace='icd-10') => {
  return axios.post(`/api/keywords/v1/${namespace}/search`, {
    text: searchTerm
  })
    .catch((error) => {
      logout()
    })
}

const uploadMedia = (file, metadata, selectedJob, patientsnamn, patientnummer, doktorsnamn, avdelning, selectedTemplate, selectedJournalSystem) => {
  const body = new FormData()
  body.append('media', file)
  if (metadata) {
    const metadataPart = new Blob([JSON.stringify({
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
        section_template: selectedTemplate,
        categories: ["icd-10", "kva"]
      },
      export: [
        {
          system_id: selectedJournalSystem
        }
      ]
    })], {
      type: 'application/json'
    })

    body.set('metadata', metadataPart)
  }

  return axios.post('/api/transcriptions/v1', body)
    .catch((error) => {
      console.log(error)
    })
}

const loadTranscription = (transcriptionId) => {
  return axios.get(`/api/transcriptions/v1/${transcriptionId}`)
    .catch((error) => {
      logout()
    })
}

const approveTranscription = (transcriptionId) => {
  return axios.post(`/api/transcriptions/v1/${transcriptionId}/approve`)
    .catch((error) => {
      logout()
    })
}

const rejectTranscription = (transcriptionId) => {
  return axios.post(`/api/transcriptions/v1/${transcriptionId}/reject`)
    .catch((error) => {
      logout()
    })
}

const updateTranscription = (transcriptionId, tags, chapters, template_id) => {
  return axios.put(`/api/transcriptions/v1/${transcriptionId}`,
    {
      tags,
      transcriptions: chapters,
      template_id
    })
    .catch((error) => {
      logout()
    })
}

const trainingGetNext = () => {
  return axios.get(`/api/training/v2/transcript`)
    .catch(error => console.log(error))
}

const trainingUpdate = (transcriptionId, updatedText) => {
  return axios.post(`/api/training/v2/transcript/${transcriptionId}/status`,
    {
      text: updatedText
    })
    .catch((error) => {
      logout()
    })
}

const trainingReject = (transcriptionId) => {
  return axios.post(`/api/training/v2/transcript/${transcriptionId}/status`,
    {
      reject: true
    })
    .catch((error) => {
      console.log(error)
    })
}

const getSectionTemplates = () => {
  return axios.get(`/api/sections/v1`)
    .catch(error => error)
}

const getChartData = () => {
  return axios.get(`/api/charts/v1/CHART_ID`)
    .catch((error) => {
      console.log(error)
    })
}

export default {
  approveTranscription,
  rejectTranscription,
  setToken,
  keywordsSearch,
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
  getSectionTemplates,
  getChartData
}
