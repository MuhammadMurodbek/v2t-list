import api from '../api'
import {
  addErrorToast
} from '../components/GlobalToastList'
import _ from 'lodash'


export async function renderTranscriptionState(id) {
  const BACKOFF = 2000
  const INTERVAL = 2000
  let failedTries = 0

  try {
    const response = await api.transcriptState(id)

    if (response.status >= 400) {
      throw new Error(`Request did not succeed: ${response.status}`)
    }

    const { exports } = response.data

    const state = (Array.isArray(exports) && exports.length)
      ? exports[0].state : response.data.state
    const error = (Array.isArray(exports) && exports.length)
      ? exports[0].error : null

    failedTries = 0

    switch(state) {
    case 'ERROR':
      addErrorToast(state, error, 20000)
      break
    case 'PENDING':
      renderTranscriptionState(id)
      break
    case 'EXPORTED':
    case 'APPROVED':
      _.delay(() => window.location.href = '/', 1000)
      break
    default:
      throw new Error(`Unsupported state type ${state}`)
    }
  } catch (e) {
    // back off
    failedTries++
    setTimeout(
      () => renderTranscriptionState(id)
      , INTERVAL + failedTries * BACKOFF
    )
    console.error(e)
  }
}


export const sendMail = (subject, body) => {
  window.open(
    `mailto:v2t-support@inoviagroup.se
    ?subject=${subject}&body=${body}`
  )
}