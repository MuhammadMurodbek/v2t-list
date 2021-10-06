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
} from '@patronum/eui'
import '../styles/j4login.scss'
import api from '../api'
import { delay } from 'lodash'
import { renderTranscriptionState } from '../utils'

const J4Login = ({
  onClose,
  isOpen,
  transcriptionId
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const onSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    api.approveTranscription(transcriptionId, {
      channelSettings: [
        {
          channel: 'J4',
          name: 'principal',
          value: username
        }, {
          channel: 'J4',
          name: 'secret',
          value: password
        }
      ]
    }).then(
      () => {
        delay(renderTranscriptionState, 500, transcriptionId)
        onClose()
      },
      (error) => {
        if (error instanceof Error) {
          setError(error.message)
        }
        setIsLoading(false)
        console.error(error)
      }
    )
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
              <h3>Login for J4</h3>
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
  transcriptionId: PropTypes.string.isRequired
}