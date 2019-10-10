import axios from 'axios'

const headers = {
  'Content-Type': 'application/json'
}

function setToken(token) {
  if (this.token !== '') {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    axios.defaults.headers.common.Authorization = undefined
  }
}

function logout() {
  axios.defaults.headers.common.Authorization = undefined
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  window.location.replace('/')
}

function login(username, password) {
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

function loadTags() {
  return axios.get('/api/tickets/v1/tags/active')
    .then(response => response.data)
    .catch((error) => {
      logout()
    })
}

function loadTickets(tag, pageIndex, pageSize) {
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

function keywordsSearch(searchTerm) {
  return axios.post('/api/keywords/v1/icd-10/search', {
    text: searchTerm
  })
    .catch((error) => {
      logout()
    })
}

function uploadMedia(file, metadata, selectedJob) {
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

function loadTranscription(transcriptionId) {
  return axios.get(`/api/transcriptions/v1/${transcriptionId}`)
    .catch((error) => {
      logout()
    })
}

function approveTranscription(transcriptionId) {
  return axios.post(`/api/transcriptions/v1/${transcriptionId}/approve`)
    .catch((error) => {
      logout()
    })
}

function updateTranscription(transcriptionId, tags, chapters) {
  return axios.put(`/api/transcriptions/v1/${transcriptionId}`,
    {
      tags,
      transcriptions: chapters
    })
    .catch((error) => {
      logout()
    })
}

function trainingGetNext() {
  return axios.get('/api/training/v1')
    .catch((error) => {
      logout()
    })
}

function trainingUpdate(transcriptionId, sequenceNumber, updatedText) {
  return axios.put(`/api/training/v1/${transcriptionId}/${sequenceNumber}`,
    {
      text: updatedText
    })
    .catch((error) => {
      logout()
    })
}

function trainingReject(transcriptionId, sequenceNumber) {
  return axios.put(`/api/training/v1/${transcriptionId}/${sequenceNumber}`,
    {
      status: 'REJECT'
    })
    .catch((error) => {
      logout()
    })
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
  uploadMedia
}
