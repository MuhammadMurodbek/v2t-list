import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  EuiTitle,
  EuiFormRow,
  EuiButton,
  EuiOverlayMask,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiFieldText,
  EuiText,
  EuiTextColor
} from '@elastic/eui'
import '../styles/j4login.scss'
import api from '../api'
import { renderTranscriptionState } from '../utils'

const J4Login = ({
  onClose,
  isOpen,
  transcriptionId,
  editSeconds,
  outgoingChannel
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await api.approveTranscription(transcriptionId, {
        channelSettings: [
          {
            channel: outgoingChannel.id,
            name: 'principal',
            value: username.trim()
          },
          {
            channel: outgoingChannel.id,
            name: 'secret',
            value: password.trim()
          }
        ],
        metrics: {
          editSeconds
        }
      })
      await renderTranscriptionState(transcriptionId)
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isOpen) {

    return (
      <EuiOverlayMask>
        <EuiModal
          onClose={onClose}
          className="login-j4"
        >
          <EuiModalHeader>
            <EuiTitle>
              <h3>Login for {`${outgoingChannel.id}`}</h3>
            </EuiTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <form onSubmit={onSubmit}>
              <EuiFormRow>
                <EuiFieldText
                  placeholder="Username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </EuiFormRow>
              <EuiFormRow>
                <EuiFieldText
                  placeholder="Password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </EuiFormRow>
              <EuiButton
                isLoading={isLoading}
                fullWidth
                fill
                disabled={!username || !password}
                type="submit"
              >
              Login
              </EuiButton>
              <EuiText>
                <EuiTextColor color="danger">{error}</EuiTextColor>
              </EuiText>
            </form>
          </EuiModalBody>
        </EuiModal>
      </EuiOverlayMask>
    )
  }

  return null
}

export default J4Login

J4Login.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  transcriptionId: PropTypes.string.isRequired,
  editSeconds: PropTypes.number.isRequired,
  outgoingChannel: PropTypes.object.isRequired
}
