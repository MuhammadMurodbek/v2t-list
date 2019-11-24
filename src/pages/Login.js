import React, { useEffect, useState } from 'react'
import {
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage
} from '@elastic/eui'
import swal from 'sweetalert'
import { usePreferences } from '../components/PreferencesProvider'
// import logo from '../img/medspeech+Inovia_logo_rgb.original.png'
import logo from '../img/medspeech+Inovia_logo_rgb.png'
import api from '../api'




const LoginPage = () => {
  
  const [username, setUsername] = useState('test')
  const [password, setPassword] = useState('test')
  const [preferences, setPreferences] = usePreferences()
  const setToken = (authtoken) => {
    setPreferences({ token: authtoken })
  }

  useEffect(() => {
    document.title = 'Inovia AI :: Log in 🗝'
  })

  const login = () => {
    if (username === '' || password === '') {
      swal({
        title: 'Felaktigt användarnamn eller lösenord',
        text: '',
        icon: 'error',
        button: 'Avbryt'
      })
    } else {
      api.login(username, password)
        .then((token) => {
          setUsername('')
          setPassword('')
          setToken(token)
          window.location.replace('/')
        })
        .catch((error) => {
          swal({
            title: 'Nekad åtkomst, behörighet saknas',
            text: '',
            icon: 'error',
            button: 'Avbryt'
          })
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
      <div className="login">

        <EuiImage
          className="logo"
          size="m"
          alt="logo"
          url={logo}
        />
      
      <EuiFlexGroup >
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
            style={{color:"white"}}
            type="submit"
            onClick={() => login()}
          >
            Logga In
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
      </div>
  )
}

export default LoginPage
