/* eslint-disable no-console */
// eslint-disable-next-line no-console
import React, { Component } from 'react'
import { HashRouter, Route, Switch } from 'react-router-dom'
import {
  EuiImage,
  EuiPage,
  EuiPageSideBar,
  EuiButtonEmpty,
  EuiSideNav,
  EuiButtonIcon,
  EuiI18n
} from '@elastic/eui'
import logo from './img/medspeech+Inovia_logo_rgb.png'
import PreferencesProvider from './components/PreferencesProvider'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import UploadPage from './pages/Upload'
import TrainingPage from './pages/Training'
import LiveDikteringPage from './pages/LiveDiktering'
import LiveDikteringEnglishPage from './pages/LiveDikteringEnglish'
import GuidedLivePage from './pages/GuidedLive'
import LoginPage from './pages/Login'
import Invalid from './pages/Invalid'
import Preference from './models/Preference'
import './App.css'
import api from './api'
import axios from 'axios'
import { LanguageProvider } from './context'
import { withProvider } from './hoc'
import {
  GlobalToastListContainer,
  addErrorToast
} from './components/GlobalToastList'

class App extends Component {
  state = {
    transcripts: [],
    preferences: new Preference(),
    selectedItemName: 'lungor',
    isLoggedIn: false,
    isTokenFromUrl: false,
    token: null,
    isCollapsed: false,
    job: null,
    contentLength: -1,
    pageIndex: 0
  }

  componentDidMount() {
    const queryToken = getQueryStringValue('token')
    if (queryToken) {
      this.setState({ isTokenFromUrl: true })
    }
    this.fetchTranscripts()
  }

  setPreferences = (state) => {
    const { preferences } = this.state
    this.setState({
      preferences: preferences.clone().add(state)
    })
  }

  setPageIndex = (pageIndex) => {
    this.setState({
      pageIndex
    })
  }

  fetchTranscripts = (tag = undefined, pageIndex = 0, pageSize = 20) => {
    return new Promise((resolve) => {
      const tokenFromStorage = localStorage.getItem('token')
      const tokenFromQuery = getQueryStringValue('token')
      let token

      if (tokenFromStorage) {
        token = tokenFromStorage
      }

      if (tokenFromQuery) {
        token = tokenFromQuery
        this.setState({ isTokenFromUrl: true })
      }

      if (token) {
        this.setState({ isLoggedIn: true, token })
        api.setToken(token)

        api
          .loadTickets(tag, pageIndex, pageSize)
          .then(({ data: transcripts }) => {
            // Check which one are audio and
            // which are video before loading all active jobs
            this.setState({ transcripts })
          })
          .catch(() => {
            addErrorToast()
          })

        api
          .loadTags()
          .then(({ data: activeTags }) => {
            // Count number of active tags
            const { selectedItemName } = this.state
            const sideBar = []
            const totalContentLength = activeTags.reduce(
              (accumilator, currentTag) => {
                return accumilator + currentTag.count
              },
              0
            )
            if (this.state.contentLength === -1)
              this.setState({ contentLength: totalContentLength })
            activeTags.forEach((tag) => {
              const temp = {
                id: tag.value,
                name: `${tag.value} (${tag.count})`,
                isSelected: selectedItemName === tag.value,
                onClick: () => {
                  this.selectItem(tag.value)
                  this.setState({
                    transcripts: []
                  })
                  api
                    .loadTickets(tag.value, 0, 20)
                    .then(({ data: transcripts }) => {
                      // transcripts after job selection
                      // Check which one are audio and which are video
                      this.setState({
                        transcripts,
                        job: tag.value,
                        contentLength: tag.count,
                        pageIndex: 0
                      })
                    })
                    .catch(() => {
                      addErrorToast()
                    })
                },
                href: '/#/'
              }
              sideBar.push(temp)
            })

            const parentSideBar = [
              {
                id: '',
                isSelected: false,
                items: [
                  {
                    id: 'V2T Jobs',
                    items: sideBar,
                    isSelected: true,
                    name: <EuiI18n token="v2TJob" default="V2T Job" />
                  },
                  {
                    href: '/#/upload',
                    id: 3,
                    isSelected: selectedItemName === 'Upload',
                    name: <EuiI18n token="upload" default="Upload" />,
                    onClick: () => this.selectItem('Upload')
                  },
                  {
                    href: '/#/training',
                    id: 5,
                    isSelected: selectedItemName === 'Training',
                    name: <EuiI18n token="training" default="Training" />,
                    onClick: () => this.selectItem('Training')
                  },
                  {
                    id: 7,
                    isSelected: selectedItemName === 'Co-worker',
                    name: <EuiI18n token="coWorker" default="Co-Worker" />,
                    onClick: () => {
                      if (
                        window.location.hostname.split('.')[0].includes('dev')
                      ) {
                        window
                          .open(
                            'https://v2t-dev-webdoc.inoviagroup.se/#/',
                            '_blank'
                          )
                          .focus()
                      } else if (
                        window.location.hostname.split('.')[0].includes('stage')
                      ) {
                        window
                          .open(
                            'https://v2t-stage-webdoc.inoviagroup.se/#/',
                            '_blank'
                          )
                          .focus()
                      }
                    }
                  }
                  // , {
                  //   href: '/#/guided-live',
                  //   id: 8,
                  //   isSelected: selectedItemName === 'Live',
                  //   name: 'Live Flow',
                  //   onClick: () => {
                  //     this.selectItem('Live')
                  //     this.setState({
                  //       isCollapsed: true
                  //     })
                  //   }
                  // }
                ],
                name: ''
              }
            ]
            this.setState({ sidenav: parentSideBar })
            resolve()
          })
          .catch(() => {
            addErrorToast()
          })
      }
    })
  }

  loadHomescreen = () => {
    window.location.replace('/')
  }

  selectItem = (name) => {
    this.setState({
      selectedItemName: name
    })
  }

  openHelpWindow = () => {
    window.open('https://inoviagroup.se/anvandarhandledning-v2t/', '_blank')
  }

  collapse = () => {
    const { isCollapsed } = this.state
    this.setState({
      isCollapsed: !isCollapsed
    })
  }

  render() {
    const {
      transcripts,
      preferences,
      sidenav,
      isLoggedIn,
      isTokenFromUrl,
      token,
      isCollapsed,
      job,
      contentLength,
      pageIndex
    } = this.state
    const { fetchTranscripts, setPageIndex } = this

    return (
      <HashRouter>
        <PreferencesProvider value={[preferences, this.setPreferences]}>
          <EuiPage>
            <EuiPageSideBar
              style={{
                display:
                  isLoggedIn && !isTokenFromUrl && isCollapsed === false
                    ? 'inline-block'
                    : 'none'
              }}
            >
              <EuiImage
                className="logo"
                size="m"
                alt="logo"
                url={logo}
                onClick={this.loadHomescreen}
              />
              <EuiSideNav
                mobileTitle=""
                // toggleOpenOnMobile={false}
                isOpenOnMobile={false}
                style={{ width: 300 }}
                items={sidenav}
              />
              <EuiButtonEmpty
                size="l"
                contentProps={{
                  style: {
                    justifyContent: 'flex-start'
                  }
                }}
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: 12,
                  fontWeight: 600,
                  bottom: 40,
                  width: 100,
                  background: 'transparent'
                }}
                onClick={() => this.collapse()}
              >
                <EuiI18n token="collapse" default="Collapse" />
              </EuiButtonEmpty>
              <EuiButtonEmpty
                size="l"
                contentProps={{
                  style: {
                    justifyContent: 'flex-start'
                  }
                }}
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: 12,
                  fontWeight: 600,
                  bottom: 10,
                  width: 100,
                  background: 'transparent'
                }}
                onClick={() => this.openHelpWindow()}
              >
                <EuiI18n token="help" default="Help" />
              </EuiButtonEmpty>
            </EuiPageSideBar>
            <EuiPageSideBar
              style={{
                display:
                  isLoggedIn && !isTokenFromUrl && isCollapsed === true
                    ? 'inline-block'
                    : 'none',
                minWidth: '20px'
              }}
            >
              <EuiButtonIcon
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: -20,
                  right: 10,
                  fontWeight: 600,
                  bottom: 40,
                  width: 100,
                  background: 'transparent'
                }}
                iconType="arrowRight"
                aria-label="Expand"
                disabled={false}
                onClick={() => this.collapse()}
              />
              {/* <EuiButtonEmpty
                size="l"
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: 0,
                  right: 10,
                  fontWeight: 600,
                  bottom: 40,
                  width: 100,
                  background: 'transparent'
                }}
                onClick={() => this.collapse()}
              > */}
              --
              {/* </EuiButtonEmpty> */}
            </EuiPageSideBar>

            <Switch>
              <Route
                exact
                path="/"
                render={(props) =>
                  isLoggedIn ? (
                    <StartPage
                      {...{
                        ...props,
                        transcripts,
                        job,
                        fetchTranscripts,
                        contentLength,
                        pageIndex,
                        setPageIndex
                      }}
                    />
                  ) : (
                    <LoginPage />
                  )
                }
              />
              <Route
                path="/edit/:id"
                render={(props) => {
                  const { id } = props.match.params
                  const preloadedTranscript = transcripts.find(
                    (currentTranscript) => currentTranscript.id === id
                  )
                  return (
                    <EditPage
                      {...{ ...props, id, preloadedTranscript, token }}
                    />
                  )
                }}
              />
              <Route
                path="/upload/"
                render={() => (isLoggedIn ? <UploadPage /> : <LoginPage />)}
              />
              <Route
                path="/training/"
                render={() => (isLoggedIn ? <TrainingPage /> : <LoginPage />)}
              />
              <Route
                path="/guided-live/"
                render={() => (isLoggedIn ? <GuidedLivePage /> : <LoginPage />)}
              />
              <Route
                path="/livediktering/"
                render={() =>
                  isLoggedIn ? <LiveDikteringPage /> : <LoginPage />
                }
              />
              <Route
                path="/live-diktering-engelska/"
                render={() =>
                  isLoggedIn ? <LiveDikteringEnglishPage /> : <LoginPage />
                }
              />
              <Route
                path="/login"
                render={(props) =>
                  isLoggedIn ? (
                    <StartPage
                      {...{
                        ...props,
                        transcripts
                      }}
                    />
                  ) : (
                    <LoginPage />
                  )
                }
              />
              <Route
                render={() => (isLoggedIn ? <Invalid /> : <LoginPage />)}
              />
            </Switch>
            <GlobalToastListContainer />
          </EuiPage>
        </PreferencesProvider>
      </HashRouter>
    )
  }
}

const getQueryStringValue = (key) => {
  return decodeURIComponent(
    window.location.href.replace(
      new RegExp(
        `^(?:.*[&\\?]${encodeURIComponent(key).replace(
          /[.+*]/g,
          '\\$&'
        )}(?:\\=([^&]*))?)?.*$`,
        'i'
      ),
      '$1'
    )
  )
}

const queryToken = getQueryStringValue('token')
if (queryToken)
  api.setToken(queryToken)

axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response.status === 401 || error.response.status === 403) {
      addErrorToast(
        null,
        <EuiI18n token="authError" default="Invalid username or password" />
      )

      return api.logout()
    } else {
      return Promise.reject(error)
    }
  }
)

export default withProvider(App, LanguageProvider)
