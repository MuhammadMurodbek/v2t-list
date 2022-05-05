import React, { useState } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiI18n,
  EuiHorizontalRule,
  EuiFieldText,
  EuiButton,
  EuiFormRow,
  EuiSpacer
} from '@elastic/eui'
import PropTypes from 'prop-types'
import Page from '../components/Page'
import { revokeTranscription } from '../api'
import { addErrorToast, addSuccessToast } from '../components/GlobalToastList'

const Revoke = ({ history }) => {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRevoke = async () => {
    setLoading(true)
    try {
      const response = await revokeTranscription({
        id: value
      })
      if (response.status === 200) {
        addSuccessToast(
          <EuiI18n
            token="transcriptionRevokedSuccessfully"
            default="Transcription revoked successfully"
          />
        )
        history.push('/')
      }
    } catch (error) {
      const { status } = error.request
      if (status === 403) {
        addErrorToast(
          <EuiI18n
            token="forbiddenRevoke"
            default="The user does not have sufficient 
                     privileges to revoke the transcription"
          />
        )
      } else if (status === 409) {
        addErrorToast(
          <EuiI18n
            token="conflictRevoke"
            default="The user does not have sufficient 
                     privileges to revoke the transcription"
          />
        )
      } else if (status === 400) {
        addErrorToast(
          <EuiI18n
            token="theTranscriptNotAvailable"
            default="The transcription is not available"
          />
        )
      } else {
        addErrorToast(<EuiI18n token="Error" default={error.message} />)
      }
    } finally {
      setValue('')
      setLoading(false)
    }
  }

  return (
    <EuiI18n token="revoke" default="Revoke">
      {(title) => {
        document.title = `Inovia AI :: ${title}`
        return (
          <Page preferences title={title}>
            <EuiFlexGroup responsive={false}>
              <EuiFlexItem>
                <EuiForm>
                  <EuiHorizontalRule />
                  <EuiFormRow
                    label={
                      <EuiI18n
                        token="transcriptionID"
                        default="Transcription Id"
                      />
                    }
                  >
                    <EuiFieldText
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </EuiFormRow>
                  <EuiSpacer />
                  <EuiButton
                    isLoading={loading}
                    disabled={value.length == 0}
                    onClick={handleRevoke}
                  >
                    Revoke
                  </EuiButton>
                </EuiForm>
              </EuiFlexItem>
            </EuiFlexGroup>
          </Page>
        )
      }}
    </EuiI18n>
  )
}

Revoke.propTypes = {
  history: PropTypes.any
}

export default Revoke
