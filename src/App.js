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
  EuiButtonIcon
} from '@elastic/eui'
import logo from './img/medspeech+Inovia_logo_rgb.png'
import PreferencesProvider from './components/PreferencesProvider'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import UploadPage from './pages/Upload'
// import AnalyticsPage from './pages/Analytics'
import TrainingPage from './pages/Training'
import LiveDikteringPage from './pages/LiveDiktering'
import GuidedLivePage from './pages/GuidedLive'
import LoginPage from './pages/Login'
import Invalid from './pages/Invalid'
import Visualization from './pages/Visualization'
import Preference from './models/Preference'
import './App.css'
import api from './api'

export default class App extends Component {
  state = {

    transcripts: [],
    preferences: new Preference(),
    selectedItemName: 'lungor',
    isLoggedIn: false,
    isTokenFromUrl: false,
    token: null,
    isCollapsed: false,
    job: null
  }

  componentDidMount() {
    this.fetchTranscripts()
  }

  setPreferences = (state) => {
    const { preferences } = this.state
    this.setState({
      preferences: preferences.clone()
        .add(state)
    })
  }


  getQueryStringValue(key) {
    return decodeURIComponent(
      window
        .location
        .href
        .replace(
          new RegExp(
            `^(?:.*[&\\?]${
              encodeURIComponent(key)
                .replace(/[.+*]/g, '\\$&')
            }(?:\\=([^&]*))?)?.*$`, 'i'
          ), '$1'
        )
    )
  }  

  fetchTranscripts = () => {
    const tokenFromStorage = localStorage.getItem('token')
    const tokenFromQuery = this.getQueryStringValue('token')
    let token 
    
    if (tokenFromStorage) {
      token = tokenFromStorage
    }

    if (tokenFromQuery) {
      token = tokenFromQuery
      this.setState({isTokenFromUrl: true})
    }
    
    if (token) {
      this.setState({ isLoggedIn: true, token })
      api.setToken(token)

      api.loadTickets(undefined, 0, 200)
        .then((tickets) => {
          // Check which one are audio and 
          // which are video before loading all active jobs
          this.setState({ transcripts: tickets })
        })

      api.loadTags()
        .then((activeTags) => {
          // Count number of active tags
          const { selectedItemName } = this.state
          const sideBar = []
          activeTags.forEach((tag) => {
            const temp = {
              id: tag.value,
              name: `${tag.value} (${tag.count})`,
              isSelected: selectedItemName === tag.value,
              onClick: () => {
                this.selectItem(tag.value)
                api.loadTickets(tag.value, 0, 200)
                  .then((tickets) => {
                    // transcripts after job selection
                    // Check which one are audio and which are video
                    this.setState({ transcripts: tickets, job: tag.value })      
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
                  name: 'V2T Jobb'
                }, {
                  href: '/#/upload',
                  id: 3,
                  isSelected: selectedItemName === 'Upload',
                  name: 'Ladda Upp',
                  onClick: () => this.selectItem('Upload')
                }, {
                  id: 4,
                  isSelected: selectedItemName === 'Analytics',
                  name: 'Analytics',
                  onClick: () => {
                    if(window.location.hostname.split('.')[0].includes('dev')) {
                      window
                        .open('https://v2t-dev-kibana.inoviagroup.se', '_blank')
                        .focus()
                    } else if (
                      window
                        .location
                        .hostname
                        .split('.')[0]
                        .includes('stage')
                    ) {
                      window
                        .open(
                          'https://v2t-stage-kibana.inoviagroup.se', '_blank'
                        )
                        .focus()
                    }
                  }
                }, {
                  href: '/#/training',
                  id: 5,
                  isSelected: selectedItemName === 'Training',
                  name: 'Träning',
                  onClick: () => this.selectItem('Training')
                }, {
                  href: '/#/visualization',
                  id: 6,
                  isSelected: selectedItemName === 'Visualization',
                  name: 'Visualization',
                  onClick: () => this.selectItem('Visualization')
                }, {
                  id: 7,
                  isSelected: selectedItemName === 'Co-worker',
                  name: 'Co-worker',
                  onClick: () => {
                    if (
                      window.location.hostname.split('.')[0].includes('dev')
                    ) {
                      window
                        .open(
                          'https://v2t-dev-webdoc.inoviagroup.se/#/', '_blank'
                        )
                        .focus()
                    } else if (
                      window.location.hostname.split('.')[0].includes('stage')
                    ) { 
                      window
                        .open(
                          'https://v2t-stage-webdoc.inoviagroup.se/#/', '_blank'
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
        })
        .catch((error) => {
          console.log(error)
        })
    }
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
    window.open("https://inoviagroup.se/anvandarhandledning-v2t/", "_blank")
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
      job
    } = this.state

    return (
      <HashRouter>
        <PreferencesProvider value={[preferences, this.setPreferences]}>
          <EuiPage>
            <EuiPageSideBar
              style={{
                display: 
                  isLoggedIn 
                  && !isTokenFromUrl 
                    && isCollapsed === false ? 'inline-block' : 'none'
              }}>
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
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: 0,
                  fontWeight: 600,
                  bottom: 40,
                  width: 100,
                  background: 'transparent'
                }}
                onClick={() => this.collapse()}
              >
                Collapse
              </EuiButtonEmpty>
              <EuiButtonEmpty
                size="l"
                style={{
                  color: 'white',
                  position: 'fixed',
                  left: -12,
                  fontWeight: 600,
                  bottom: 10,
                  width: 100,
                  background: 'transparent'
                }}
                onClick={() => this.openHelpWindow()}
              >
                Hjälp
              </EuiButtonEmpty>
            </EuiPageSideBar>
            <EuiPageSideBar
              style={{
                display:
                  isLoggedIn
                    && !isTokenFromUrl
                    && isCollapsed === true ? 'inline-block' : 'none',
                    minWidth: '20px'
              }}>
      
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
                iconType="arrowLeft"
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
                render={props => isLoggedIn ? <StartPage {...{
                  ...props, transcripts, job
                }} /> : <LoginPage/>}/>
              <Route
                path="/edit/:id"
                render={(props) => {
                  const transcript = transcripts
                    .find(
                      currentTranscript => 
                        currentTranscript.external_id === props.match.params.id)
                  if (transcript)
                    return <EditPage {...{...props,transcript, token}} />
                  else
                    return <Invalid />
                }}
              />
              <Route
                path="/upload/"
                render={ () => isLoggedIn ? <UploadPage/> : <LoginPage/>}/>
              <Route path="/training/"
                render={() => isLoggedIn ? <TrainingPage/> : <LoginPage/>}/>
              <Route path="/guided-live/"
                render={() => isLoggedIn ? <GuidedLivePage/> : <LoginPage/>}/>
              <Route path="/livediktering/"
                render={() => isLoggedIn ? <LiveDikteringPage/> : <LoginPage/>}
              />
              <Route path="/visualization/"
                render={() => isLoggedIn ? <Visualization /> : <LoginPage/>}/>
              <Route path="/login"
                render={props => isLoggedIn ? <StartPage {...{
                  ...props,
                  transcripts
                }} /> : <LoginPage/>}/>
              <Route 
                render={() => isLoggedIn ? <Invalid /> : <LoginPage />} />
            </Switch>
          </EuiPage>
        </PreferencesProvider>
      </HashRouter>
    )
  }
}
