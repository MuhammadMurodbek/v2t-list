import React, { useEffect, useState } from 'react'
import {
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage
} from '@elastic/eui'
import { usePreferences } from '../components/PreferencesProvider'
import logo from '../img/medspeech+Inovia_logo_rgb.original.png'
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
    document.addEventListener('keydown', handleKeyPress)
  })


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      login()
    }
  }

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
        .catch((error) => {
          alert('Unauthorized access')
          console.log(error)
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
    <Page title="">
      <div className="login"></div>
        <EuiImage
          className="logo"
          size="m"
          alt="logo"
          url={logo}
        />
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
            size="l"
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
