/* eslint-disable no-console */
// eslint-disable-next-line no-console
import React, { Component, useState, useEffect } from 'react'
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom'
import jwtDecode from 'jwt-decode'
import {
  EuiImage,
  EuiPage,
  EuiPageSideBar,
  EuiSideNav,
  EuiButtonIcon,
  EuiI18n
} from '@elastic/eui'
import logo from './img/medspeech+Inovia_logo_rgb.png'
import collapsedLogo from './img/medspeech+Inovia_logo_rgb_collapsed.png'
import PreferencesProvider from './components/PreferencesProvider'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import TranscriptionPage from './pages/Transcription'
import UploadPage from './pages/Upload'
import Live from './pages/Live'
import LoginPage from './pages/Login'
import Invalid from './pages/Invalid'
import Preference from './models/Preference'
import './App.scss'
import api, { URLS } from './api'
import axios from 'axios'
import { LanguageProvider } from './context'
import { withProvider } from './hoc'
import {
  GlobalToastListContainer,
  addWarningToast,
  addErrorToast,
  clearGlobalToastList
} from './components/GlobalToastList'
import { 
  addUnexpectedErrorToast 
} from './components/GlobalToastList/GlobalToastList'
import getQueryStringValue from './models/getQueryStringValue'
import { EventHandler } from './components/EventHandler'
import VersionBadge from './components/VersionBadge'
import Revoke from './pages/Revoke'

class App extends Component {
  state = {
    transcripts: [],
    preferences: new Preference(),
    selectedItem: '',
    isLoggedIn: false,
    isTokenFromUrl: false,
    token: localStorage.getItem('token'),
    isCollapsed: localStorage.getItem('isSidebarCollapsed') === 'true',
    job: null,
    contentLength: -1,
    pageIndex: 0,
    activeDepartments: [],
    transcriptId: '',
    hasNoTags: false
  }

  componentDidMount() {
    axios.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        if (error.response.status === 401) {
          console.info('Here: Error 401')
          if(error.config.url !== URLS.login) {
            clearGlobalToastList()
            addErrorToast(
              <EuiI18n token="sessionError"
                default="Your session has been expired, please login again" />
            )
          }
          api.logout()
          this.setState({ isLoggedIn: false })
        }
        return Promise.reject(error)
      }
    )

    const queryToken = getQueryStringValue.prototype.decodeToken('token')
    if (queryToken) {
      this.setState({ isTokenFromUrl: true })
    }
    this.fetchTranscripts()
  }

  componentDidUpdate(prevProps, prevState) {
    const { job } = this.state
    if (job !== prevState.job) {
      this.fetchTranscripts(job)
    }
  }

  setPreferences = (update) => {
    const { preferences } = this.state
    this.setState({
      preferences: preferences.add(update)
    })
  }

  setPageIndex = (pageIndex) => {
    this.setState({
      pageIndex
    })
  }

  setTranscriptId = (transcriptId) => {
    this.setState({ transcriptId })
  }

  fetchTranscripts = (
    tag = undefined,
    pageIndex = 0,
    pageSize = 20,
    sortField = 'updatedTime',
    sortDirection = 'desc'
  ) => {
    return new Promise((resolve, reject) => {
      const tokenFromStorage = localStorage.getItem('token')
      const tokenFromQuery = getQueryStringValue.prototype.decodeToken('token')
      let token
      let orderBy

      if (tokenFromStorage) {
        token = tokenFromStorage
      }

      if (tokenFromQuery) {
        token = tokenFromQuery
        this.setState({ isTokenFromUrl: true })
      }

      if (sortField && sortDirection) {
        switch(sortField) {
        case 'updatedTime':
          orderBy = `UPDATED_${sortDirection.toUpperCase()}`
          break
        case 'receivedTime':
          orderBy = `RECEIVED_${sortDirection.toUpperCase()}`
          break
        case 'createdTime':
        default:
          orderBy = `CREATED_${sortDirection.toUpperCase()}`
        }
      }

      if (token) {
        this.setState({ isLoggedIn: true, token })
        api.setToken(token)

        api
          .loadTags()
          .then(({ data }) => {
            const activeTags = data.departments ? data.departments : []
            // Count number of active tags
            const sideBar = []

            if(!tag && activeTags.length) {
              tag = activeTags[0].id
              this.selectItem(tag)
            } else if (activeTags.length === 0) {
              this.setState({ hasNoTags: true })
            }

            if (tag) {
              api
                .loadTickets(tag, pageIndex, pageSize, orderBy)
                .then(({ data }) => {
                  const {
                    items: transcripts,
                    total: contentLength
                  } = data
                  // Check which one are audio and
                  // which are video before loading all active jobs
                  this.setState({
                    transcripts,
                    contentLength,
                    activeDepartments: activeTags
                  })
                })
                .catch((e) => {
                  addUnexpectedErrorToast(e)
                  reject()
                })
            }

            activeTags.forEach((tag) => {
              const temp = {
                id: tag.id,
                name: `${tag.name} (${tag.count})`,
                onClick: () => {
                  const { selectedItem } = this.state
                  if (selectedItem !== tag.id) {
                    this.setState({
                      transcripts: [],
                      selectedItem: tag.id
                    })
                    api
                      .loadTickets(tag.id, pageIndex, pageSize, orderBy)
                      .then(({ data }) => {
                        const {
                          items: transcripts,
                          total: contentLength
                        } = data
                        // transcripts after job selection
                        // Check which one are audio and which are video
                        this.setState({
                          transcripts,
                          job: tag.id,
                          contentLength,
                          pageIndex: 0
                        })
                      })
                      .catch((e) => {
                        addUnexpectedErrorToast(e)
                      })
                  }
                },
                href: '/#/'
              }
              sideBar.push(temp)
            })

            const parentSideBar = [
              {
                id: '',
                items: [
                  {
                    id: 'V2T Jobs',
                    items: sideBar,
                    forceOpen: true,
                    name: <EuiI18n token="department" default="Department" />
                  },
                  // {
                  //   id: 'Conversations',
                  //   href: '/#/transcriptor',
                  //   name: <EuiI18n token="samtal" default="Transcriptor" />,
                  //   onClick: () => {
                  //     this.selectItem('Conversations')
                  //   }
                  // },
                  {
                    href: '/#/upload',
                    id: 'Upload',
                    name: <EuiI18n token="upload" default="Upload" />,
                    onClick: () => this.selectItem('Upload')
                  },
                  {
                    href: '/#/revoke',
                    id: 'Revoke',
                    name: <EuiI18n token="revoke" default="Revoke" />,
                    onClick: () => this.selectItem('Revoke')
                  },
                  {
                    href: '/#/live',
                    id: 'Live',
                    name: <EuiI18n token="live" default="Live Dictation" />,
                    onClick: () => this.selectItem('Live')
                  },
                  // {
                  //   href: '/#/live-diktering',
                  //   id: 'Live Diktering',
                  //   name: <EuiI18n token="live" default="Live Dictation" />,
                  //   onClick: () => {
                  //     this.selectItem('Live Diktering')
                  //   }
                  // }
                  // ,
                  {
                    id: 'Collapse',
                    name: <EuiI18n token="collapse" default="Collapse" />,
                    onClick: () => {
                      this.toggleCollapsed()
                    }
                  },
                  {
                    id: 'Help',
                    name: <EuiI18n token="help" default="Help" />,
                    onClick: () => {
                      this.openHelpWindow()
                    }
                  }
                ],
                name: ''
              }
            ]
            this.setState({ sidenav: parentSideBar })
            resolve()
          })
          .catch((e) => {
            addUnexpectedErrorToast(e)
            reject()
          })
      }
    })
  }

  loadHomescreen = () => {
    window.location.replace('/')
  }

  selectItem = (selectedItem) => {
    this.setState({
      selectedItem
    })
  }

  openHelpWindow = () => {
    window.open('https://inoviagroup.se/anvandarhandledning-v2t/', '_blank')
  }

  toggleCollapsed = () => {
    const isCollapsed = !this.state.isCollapsed
    localStorage.setItem('isSidebarCollapsed', isCollapsed)
    this.setState({ isCollapsed })
  }

  getSideNavItems = () => {
    const {
      sidenav,
      selectedItem
    } = this.state
    if (sidenav && sidenav.length > 0) {
      sidenav[0].items = sidenav[0].items.map(item => {
        const updatedItem = {
          ...item,
          isSelected: item.id === selectedItem
        }
        if (Array.isArray(updatedItem.items)) {
          return {
            ...updatedItem,
            items: updatedItem.items.map(subitem => {
              return {
                ...subitem,
                isSelected: subitem.id === selectedItem
              }
            })
          }
        }
        return updatedItem
      })
    }
    return sidenav
  }

  render() {
    const {
      transcripts,
      preferences,
      isLoggedIn,
      isTokenFromUrl,
      token,
      isCollapsed,
      job,
      contentLength,
      pageIndex,
      activeDepartments,
      transcriptId,
      hasNoTags
    } = this.state
    const { fetchTranscripts, setPageIndex } = this
    // set authorization token when the app is refreshed
    api.setToken(token)

    return (
      <HashRouter>
        <PreferencesProvider value={{
          preferences,
          setPreferences: this.setPreferences,
          transcriptId,
          setTranscriptId: this.setTranscriptId
        }}>
          <EuiPage>
            <VersionBadge />
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
                isOpenOnMobile={false}
                items={this.getSideNavItems()}
                className="AppNavigation"
              />
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
              <EuiImage
                className="logo"
                style={{ width: '50px', marginLeft: '-20px' }}
                alt="logo-collapsed"
                url={collapsedLogo}
                onClick={this.loadHomescreen}
              />
              <EuiButtonIcon
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: -20,
                  right: 10,
                  fontWeight: 600,
                  bottom: 60,
                  width: 100,
                  background: 'transparent'
                }}
                iconType="arrowRight"
                aria-label="Expand"
                disabled={false}
                onClick={() => this.toggleCollapsed()}
              />
            </EuiPageSideBar>
            {isLoggedIn ? (
              <Switch>
                <Route
                  exact
                  path="/"
                  render={(props) => (
                    <StartPage
                      {...{
                        ...props,
                        transcripts,
                        job,
                        fetchTranscripts,
                        contentLength,
                        pageIndex,
                        setPageIndex,
                        hasNoTags,
                        activeDepartments
                      }}
                    />
                  )}
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
                  path="/transcriptor/:transcriptionId"
                  render={(props) => {
                    const { transcriptionId } = props.match.params
                    return (
                      <TranscriptionPage
                        isListOpen={false}
                        departments={activeDepartments}
                        transcriptionId={transcriptionId}
                      />
                    )}}
                />
                <Route
                  path="/transcriptor"
                  render={() => (
                    <TranscriptionPage
                      isListOpen={false}
                      departments={activeDepartments}
                    />
                  )}
                />
                <Route
                  path="/listOfTranscriptions"
                  render={() => (
                    <TranscriptionPage
                      isListOpen={true}
                      departments={activeDepartments}
                    />
                  )}
                />
                <Route path="/upload/" render={() => <UploadPage />} />
                <Route 
                  path="/revoke/" 
                  render={(props) => <Revoke {...props}/>}/>
                <Route 
                  path="/live/" 
                  render={(props) => <Live {...props}/>}/>
                <Route
                  path="/live-diktering/:id"
                  render={(props) => {
                    const { id } = props.match.params
                    return (
                      <EditPage
                        mic
                        redirectOnSave
                        {...{ ...props, id, token }}
                      />
                    )
                  }}
                />
                <Route
                  path="/live-diktering/"
                  render={(params) => (
                    <NewLiveTranscription search={params.location.search} />
                  )}
                />
                <Route render={() => <Invalid />} />
              </Switch>
            ) : (
              <Route render={(props) => <LoginPage {...props} />} />
            )}
            <GlobalToastListContainer />
            <EventHandler />
          </EuiPage>
        </PreferencesProvider>
      </HashRouter>
    )
  }
}

const NewLiveTranscription = ({ search }) => {
  const [redirect, setRedirect] = useState(null)
  console.log('starting new live transcript')

  useEffect(() => {
    startSession().catch((e) => {
      console.error(e)
      addWarningToast(
        <EuiI18n
          token="unableToStartLiveTranscriptSession"
          default="Unable to start live trancript session."
        />,
        <EuiI18n
          token="checkNetworkConnectionOrContactSupport"
          default="Please check network connection, or contact support."
        />
      )
      return null
    })
  }, [])

  const getUsername = () => {
    const token = jwtDecode(localStorage.getItem('token'))
    return token.sub
  }

  const loadTranscriptId = async () => {
    const username = getUsername()
    let schemaId = null
    const lastUsedSchemaId = localStorage.getItem('lastUsedSchema')
    try {
      if (lastUsedSchemaId) {
        schemaId = lastUsedSchemaId
      } else {
        schemaId = await getFirstAvailableSchemaId()
      }
      const transcriptId = await api.createLiveSession(username, schemaId)
      return transcriptId
    } catch (error) {
      if (error instanceof Error) {
        addErrorToast(error.message)
      }
      console.error(error)
    }
  }

  const getFirstAvailableSchemaId = async () => {
    let schemaId = null
    const { data: { departments }} = await api.getDepartments()
    for (const department of departments) {
      const { data: { schemas }} =
            await api.getSchemas({ departmentId: department.id })

      if (Array.isArray(schemas) && schemas.length) {
        schemaId = schemas[0].id
        break
      }
    }
    return schemaId
  }

  const startSession = async () => {
    let transcriptId = null
    try {
      const { data: { id: sessionId }} = await api.getActiveLiveSession()
      console.log('sessionId', sessionId)
      if (sessionId) {
        transcriptId = sessionId
      } else {
        transcriptId = await loadTranscriptId()
      }
    } catch (error) {
      if (error.response.data.status === 404) {
        transcriptId = await loadTranscriptId()
      }
    } finally {
      setRedirect(
        <Redirect to={`/live-diktering/${transcriptId}${search}`} />
      )
    }
  }

  return redirect
}

const queryToken = getQueryStringValue.prototype.decodeToken('token')
if (queryToken) api.setToken(queryToken)

export default withProvider(App, LanguageProvider)
