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
import collapsedLogo from './img/medspeech+Inovia_logo_rgb_collapsed.png'
import PreferencesProvider from './components/PreferencesProvider'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import UploadPage from './pages/Upload'
import TrainingPage from './pages/Training'
import LiveDikteringPage from './pages/LiveDiktering'
import GuidedLivePage from './pages/GuidedLive'
import LoginPage from './pages/Login'
import Invalid from './pages/Invalid'
import Preference from './models/Preference'
import './App.css'
import api, { URLS } from './api'
import axios from 'axios'
import { LanguageProvider } from './context'
import { withProvider } from './hoc'
import {
  GlobalToastListContainer,
  addErrorToast,
  clearGlobalToastList
} from './components/GlobalToastList'
import { addUnexpectedErrorToast } from './components/GlobalToastList/GlobalToastList'

class App extends Component {
  state = {
    transcripts: [],
    preferences: new Preference(),
    selectedItem: '',
    isLoggedIn: false,
    isTokenFromUrl: false,
    token: localStorage.getItem('token'),
    isCollapsed: false,
    job: null,
    contentLength: -1,
    pageIndex: 0
  }

  componentDidMount() {
    axios.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        if (error.response.status === 401 || error.response.status === 403) {
          console.info('Here: Error 401')
          if(error.config.url !== URLS.login) {
            clearGlobalToastList()
            addErrorToast(
              <EuiI18n token="sessionError"
                default="Your session has been expired, please login again" />
            )
          }
          api.logout()
          this.setState({isLoggedIn: false})
        }
        return Promise.reject(error)
      }
    )

    const queryToken = getQueryStringValue('token')
    if (queryToken) {
      this.setState({ isTokenFromUrl: true })
    }
    this.fetchTranscripts()
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

  fetchTranscripts = (tag = undefined, pageIndex = 0, pageSize = 20, sortField, sortDirection) => {
    return new Promise((resolve) => {
      const tokenFromStorage = localStorage.getItem('token')
      const tokenFromQuery = getQueryStringValue('token')
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
          .then(({ data: activeTags }) => {
            // Count number of active tags
            const sideBar = []
            if(!tag && activeTags.length) {
              tag = activeTags[0].value
              this.selectItem(tag)
            }
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
                  contentLength
                })
              })
              .catch((e) => {
                addUnexpectedErrorToast(e)
              })

            activeTags.forEach((tag) => {
              const temp = {
                id: tag.value,
                name: `${tag.value} (${tag.count})`,
                onClick: () => {
                  const { selectedItem } = this.state
                  if (selectedItem !== tag.value) {
                    this.setState({
                      transcripts: [],
                      selectedItem: tag.value
                    })
                    api
                      .loadTickets(tag.value, pageIndex, pageSize, orderBy)
                      .then(({ data }) => {
                        const {
                          items: transcripts,
                          total: contentLength
                        } = data
                        // transcripts after job selection
                        // Check which one are audio and which are video
                        this.setState({
                          transcripts,
                          job: tag.value,
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
                    name: <EuiI18n token="v2TJob" default="V2T Job" />
                  },
                  {
                    href: '/#/upload',
                    id: 'Upload',
                    name: <EuiI18n token="upload" default="Upload" />,
                    onClick: () => this.selectItem('Upload')
                  },
                  // {
                  //   href: '/#/livediktering',
                  //   id: 'Live',
                  //   name: <EuiI18n token="live" default="Live Dictation" />,
                  //   onClick: () => this.selectItem('Live')
                  // },
                  {
                    href: '/#/training',
                    id: 'Training',
                    name: <EuiI18n token="training" default="Training" />,
                    onClick: () => this.selectItem('Training')
                  },
                  {
                    id: 'Co-worker',
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
                  }, {
                    href: '/#/live-diktering',
                    id: 'Live Diktering',
                    name: 'Live Diktering',
                    onClick: () => {
                      this.selectItem('Live Diktering')
                      this.setState({
                        isCollapsed: true
                      })
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

  collapse = () => {
    const { isCollapsed } = this.state
    this.setState({
      isCollapsed: !isCollapsed
    })
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
      pageIndex
    } = this.state
    const { fetchTranscripts, setPageIndex } = this
    // set authorization token when the app is refreshed
    api.setToken(token)

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
                items={this.getSideNavItems()}
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
            {
              isLoggedIn ? (
                <Switch>
                  <Route
                    exact
                    path="/"
                    render={(props) =>
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
                    render={() => <UploadPage />}
                  />
                  <Route
                    path="/training/"
                    render={() => <TrainingPage />}
                  />
                  <Route
                    path="/guided-live/"
                    render={() => <GuidedLivePage />}
                  />
                  <Route
                    path="/livediktering/"
                    render={() => <LiveDikteringPage />}
                  />
                  <Route
                    path="/live-diktering/"
                    render={() => <LiveDikteringPage />}
                  />
                  <Route
                    render={() => <Invalid />}
                  />
                </Switch>
              )
                : (
                  <LoginPage />
                )
            }
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
if (queryToken) api.setToken(queryToken)

export default withProvider(App, LanguageProvider)
