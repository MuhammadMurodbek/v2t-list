/* eslint-disable react/prop-types */
/* eslint-disable no-restricted-globals */
import React, { useEffect, useState } from 'react'
import {
  EuiButton,
  EuiFieldPassword,
  EuiFieldText,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiImage,
  EuiI18n,
  EuiTextColor
} from '@patronum/eui'
import { usePreferences } from '../components/PreferencesProvider'
// import logo from '../img/medspeech+Inovia_logo_rgb.original.png'
import logo from '../img/medspeech+Inovia_logo_rgb.png'
import api, { getNextUrl } from '../api'
import {
  addErrorToast,
  addUnexpectedErrorToast
} from '../components/GlobalToastList'
const LoginPage = ({ history }) => {
  const [domainList, setDomainList] = useState([])
  const [domain, setDomain] = useState()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [prefernces, setPreferences] = usePreferences()
  const setToken = (authtoken) => {
    setPreferences({ token: authtoken })
  }

  useEffect(() => {
    document.title = 'Inovia AI :: Log in 🗝'
    loadDomains()
  }, [])

  const loadDomains = async () => {
    const { data: { domains }} = await api.getDomains()
    setDomainList(domains)
    setDomain(domains[0])
  }

  const login = (e) => {
    e.preventDefault()
    if (username === '' || password === '') {
      showErrorToast()
    } else {
      api
        .login(domain, username, password)
        .then((token) => {
          setUsername('')
          setPassword('')
          setToken(token)

          const nextUrl = getNextUrl(history)
          history.push(nextUrl)
          window
            .history
            .replaceState(null, '', location.pathname + location.hash)
          window.location.reload()
        })
        .catch((error) => {
          if (error.response.status === 401 || error.response.status === 403) {
            showErrorToast()
          } else {
            addUnexpectedErrorToast(error)
          }
        })
    }
  }

  const showErrorToast = () => {
    addErrorToast(
      <EuiI18n token="authError" default="Invalid username or password" />
    )
  }

  const changeDomain = (selection) => {
    const domain
      = selection[0] ? selection[0].label : undefined
    if (domain)
      setDomain(domain)
  }

  const changePassword = (e) => {
    setPassword(e.target.value)
  }

  const changeUsername = (e) => {
    setUsername(e.target.value)
  }

  return (
    <EuiFlexGroup
      gutterSize="none"
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <EuiFlexItem grow={false}>
        <EuiImage className="logo" size="m" alt="logo" url={logo} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <form onSubmit={login} style={{ width: 300 }}>
          <EuiForm>
            <EuiFormRow
              label={<EuiTextColor color="ghost">domain</EuiTextColor>}
            >
              <EuiComboBox
                singleSelection={{ asPlainText: true }}
                options={domainList.map(label => ({ label }))}
                selectedOptions={domain ? [{ label: domain }] : []}
                onChange={changeDomain}
                isClearable={false}
              />
            </EuiFormRow>
            <EuiFormRow
              label={
                <EuiTextColor color="ghost">
                  username/ password
                </EuiTextColor>
              }
            >
              <EuiFieldText
                placeholder="username"
                autocomplete="username"
                value={username}
                onChange={changeUsername}
              />
            </EuiFormRow>
            <EuiFormRow>
              <EuiFieldPassword
                placeholder="password"
                autocomplete="current-password"
                value={password}
                onChange={changePassword}
              />
            </EuiFormRow>
            <EuiButton color="ghost" type="submit">
              <EuiI18n token="login" default="Login" />
            </EuiButton>
          </EuiForm>
        </form>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}

export default LoginPage
