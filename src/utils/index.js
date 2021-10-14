import api from '../api'
import {
  addErrorToast, addSuccessToast
} from '../components/GlobalToastList'


export async function renderTranscriptionState(id) {
  const BACKOFF = 2000
  const INTERVAL = 2000
  let failedTries = 0

  try {
    const response = await api.transcriptState(id)

    if (response.status >= 400) {
      throw new Error(`Request did not succeed: ${response.status}`)
    }

    const [{ error, state }] = response.data.exports

    failedTries = 0

    switch(state) {
    case 'ERROR':
      return addErrorToast(state, error, 20000)
    case 'PENDING':
      return renderTranscriptionState(id)
    case 'EXPORTED':
      addSuccessToast('Success!', 'Transcript exported successfully')
      window.location.href = '/'
      return
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

