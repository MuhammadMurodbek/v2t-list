import React, { useEffect, useState } from 'react'
import {
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage,
  EuiI18n
} from '@elastic/eui'
import { usePreferences } from '../components/PreferencesProvider'
// import logo from '../img/medspeech+Inovia_logo_rgb.original.png'
import logo from '../img/medspeech+Inovia_logo_rgb.png'
import api from '../api'
import { addErrorToast } from '../components/GlobalToastList'

const LoginPage = () => {
  const [username, setUsername] = useState('test')
  const [password, setPassword] = useState('test')
  // eslint-disable-next-line no-unused-vars
  const [prefernces, setPreferences] = usePreferences()
  const setToken = (authtoken) => {
    setPreferences({ token: authtoken })
  }

  useEffect(() => {
    document.title = 'Inovia AI :: Log in 🗝'
  })

  const login = (e) => {
    e.preventDefault()
    if (username === '' || password === '') {
      addErrorToast(
        null,
        <EuiI18n token="authError" default="Invalid username or password" />
      )
    } else {
      api
        .login(username, password)
        .then((token) => {
          setUsername('')
          setPassword('')
          setToken(token)
          window.location.replace('/')
        })
        .catch((error) => {
          if (error.response.status !== 401) {
            addErrorToast()
          }
        })
    }
  }

  const changePassword = (e) => {
    setPassword(e.target.value)
  }

  const changeUsername = (e) => {
    setUsername(e.target.value)
  }

  return (
    <form className="login" onSubmit={login}>
      <EuiImage className="logo" size="m" alt="logo" url={logo} />

      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFieldText
            placeholder="username"
            value={username}
            onChange={changeUsername}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFieldPassword
            placeholder="password"
            value={password}
            onChange={changePassword}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="l" style={{ color: 'white' }} type="submit">
            <EuiI18n token="login" default="Login" />
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </form>
  )
}

export default LoginPage
