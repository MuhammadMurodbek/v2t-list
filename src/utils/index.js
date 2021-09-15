import api from '../api'
import {
  addErrorToast,
  addUnexpectedErrorToast
} from '../components/GlobalToastList'


export function renderTranscriptionState(id) {
  api.transcriptState(id).then(
    ({ data: { exports }}) => {
      const [{ error, state }] = exports
      switch(state) {
      case 'ERROR':
        return addErrorToast(state, error, 20000)
      case 'PENDING':
      case 'EXPORTED':
        window.location.href = '/'
        return
      default:
        throw new Error(`Unsupported state type ${state}`)
      }
    },
    (error) => {
      return addUnexpectedErrorToast(error)
    }
  )
}
