import React, { useEffect, useState } from 'react'
import {
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer
} from '@elastic/eui'
import { usePreferences } from '../components/PreferencesProvider'
import Page from '../components/Page'
import api from '../api'

const LoginPage = () => {
  const [username, setUsername] = useState('test')
  const [password, setPassword] = useState('test')
  // const [authtoken, setAuthtoken] = useState('')
  const [preferences, setPreferences] = usePreferences()
  const setToken = (authtoken) => {
    setPreferences({ token: authtoken })
  }

  useEffect(() => {
    document.title = 'Inovia AI :: Log in 🗝'
  })


  const login = () => {
    if (username === '' || password === '') {
      alert('Invalid username or password')
    } else {
      api.login(username, password)
        .then((token) => {
          // setAuthtoken(token)
          setUsername('')
          setPassword('')
          setToken(token)
          window.location.replace('/')
        })
        .catch(() => {
          alert('Unauthorized access')
          console.log(preferences)
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
      <EuiSpacer size="m"/>
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
