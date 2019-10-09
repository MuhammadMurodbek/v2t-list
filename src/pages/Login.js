import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiFieldText,
  EuiFieldPassword,
  EuiButtonEmpty
} from '@elastic/eui'
import { usePreferences } from '../components/PreferencesProvider'
import Page from '../components/Page'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [setAuthtoken] = useState('')
  const [setPreferences] = usePreferences()
  const setToken = authtoken => {
    setPreferences({ token: authtoken })
  }

  useEffect(() => {
    document.title = 'Inovia AI :: Log in 🗝'
  })


  const login = () => {
    
    if (username === '' || password === '') {
      alert('Invalid username or password')
      return
    } else {
      axios({
        method: 'post',
        url: '/api/login/v1',
        data: { username, password },
        contentType: 'application/json'
      }).then((response) => {
        const { token } = response.data
        setAuthtoken(token)
        setUsername('')
        setPassword('')
        setToken(token)
        window.location.replace('/')
      }).catch(() => {
        alert('Unauthorized access')
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
    <Page title="Logga In">
      <EuiSpacer size="m" />
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
          <EuiButtonEmpty
            size="xl"
            color="primary"
            onClick={() => login()}
          >
            Logga In
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Page>
  )
}

export default LoginPage