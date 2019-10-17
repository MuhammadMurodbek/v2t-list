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
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
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
  return axios.get(`/api/tickets/v1?pageStart=${pageIndex}&pageSize=${pageSize}${tagParams}`)
    .then(response => response.data)
    .catch((error) => {
      logout()
    })
}

const keywordsSearch = (searchTerm) => {
  return axios.post('/api/keywords/v1/icd-10/search', {
    text: searchTerm
  })
    .catch((error) => {
      logout()
    })
}

const uploadMedia = (file, metadata, selectedJob) => {
  const body = new FormData()
  body.append('media', file)
  if (metadata) {
    body.set('metadata', new Blob([JSON.stringify({
      transcription: {
        model: metadata,
        tags: [selectedJob]
      }
    })], {
      type: 'audio/wav'
    }))
  }
  return axios.post('/api/transcriptions/v1', body)
    .catch((error) => {
      logout()
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

const updateTranscription = (transcriptionId, tags, chapters) => {
  return axios.put(`/api/transcriptions/v1/${transcriptionId}`,
    {
      tags,
      transcriptions: chapters
    })
    .catch((error) => {
      logout()
    })
}

const  trainingGetNext = () => {
  return axios.get('/api/training/v1')
    .catch(error => error)
}

const trainingUpdate = (transcriptionId, sequenceNumber, updatedText) => {
  return axios.put(`/api/training/v1/${transcriptionId}/${sequenceNumber}`,
    {
      text: updatedText
    })
    .catch((error) => {
      logout()
    })
}

const trainingReject = (transcriptionId, sequenceNumber) => {
  return axios.put(`/api/training/v1/${transcriptionId}/${sequenceNumber}`,
    {
      status: 'REJECT'
    })
    .catch((error) => {
      logout()
    })
}

const getSectionTemplates = () => {
  return axios.get(`/api/sections/v1`).catch(error => error)
}

export default {
  approveTranscription,
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
  getSectionTemplates
}
