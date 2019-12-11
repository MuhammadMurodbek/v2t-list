/* eslint-disable no-console */
// eslint-disable-next-line no-console
import React, { Component } from 'react'
import { HashRouter, Route, Switch } from 'react-router-dom'
import {
  EuiImage,
  EuiPage,
  EuiPageSideBar,
  EuiButtonEmpty,
  EuiSideNav
} from '@elastic/eui'
import logo from './img/medspeech+Inovia_logo_rgb.png'
import PreferencesProvider from './components/PreferencesProvider'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import LivePage from './pages/Live'
import UploadPage from './pages/Upload'
import AnalyticsPage from './pages/Analytics'
import TrainingPage from './pages/Training'
import LiveDikteringPage from './pages/LiveDiktering'
import LoginPage from './pages/Login'
import Preference from './models/Preference'
import './App.css'
import api from './api'

export default class App extends Component {
  state = {

    transcripts: [],
    preferences: new Preference(),
    selectedItemName: 'lungor',
    isLoggedIn: false,
    isTokenFromUrl: false
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
    return decodeURIComponent(window.location.href.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[.+*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"))
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
      this.setState({ isLoggedIn: true })
      api.setToken(token)

      api.loadTickets(undefined, 0, 200)
        .then((tickets) => {
          // Check which one are audio and which are video before loading all active jobs
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
                    this.setState({ transcripts: tickets })
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
                    window.open(`http://${window.location.hostname.replace('www', 'kibana')}`, '_blank').focus()
                  }
                }, {
                  href: '/#/training',
                  id: 5,
                  isSelected: selectedItemName === 'Training',
                  name: 'Träning',
                  onClick: () => this.selectItem('Training')
                }, {
                  href: '/#/livediktering',
                  id: 6,
                  isSelected: selectedItemName === 'Live',
                  name: 'Live Diktering',
                  onClick: () => this.selectItem('Live')
                }, {
                  href: `http://${window.location.hostname.replace('www', 'webdoc')}`,
                  id: 7,
                  isSelected: selectedItemName === 'Co-worker',
                  name: 'Co-worker',
                  onClick: () => this.selectItem('Co-worker')
                }
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

  // collapseSideBar = () => {

  // }

  render() {
    const { transcripts, preferences, sidenav, isLoggedIn, isTokenFromUrl } = this.state
    return (
      <HashRouter>
        <PreferencesProvider value={[preferences, this.setPreferences]}>
          <EuiPage>
            <EuiPageSideBar style={{ display: isLoggedIn & !isTokenFromUrl? 'inline-block' : 'none' }}>
              <EuiImage
                className="logo"
                size="m"
                alt="logo"
                url={logo}
                onClick={this.loadHomescreen}
              />
              <EuiSideNav
                mobileTitle="Navigate within $APP_NAME"
                // toggleOpenOnMobile={false}
                isOpenOnMobile={false}
                style={{ width: 300 }}
                items={sidenav}
              />
              {/* <EuiButton color="text" fill onClick={this.collapseSideBar} >Collapse</EuiButton> */}
              <EuiButtonEmpty
                size="l"
                style={{
                  color: "white",
                  position: "fixed",
                  left: -12,
                  fontWeight: 600,
                  bottom: 10,
                  width: 100,
                  background: "transparent"
                }}
                onClick={() => this.openHelpWindow()}
              >
                Hjälp
              </EuiButtonEmpty>
            </EuiPageSideBar>



            <Switch>
              <Route exact path="/" render={props => isLoggedIn ? <StartPage {...{
                ...props,
                transcripts
              }} /> : <LoginPage/>}/>
              <Route
                path="/edit/:id"
                render={(props) => {
                  const transcript = transcripts
                    .find(currentTranscript => currentTranscript.external_id === props.match.params.id)
                  return <EditPage {...{
                    ...props,
                    transcript
                  }} />
                }}
              />
              <Route path="/live/" render={props => isLoggedIn ? <LivePage/> : <LoginPage/>}/>
              <Route path="/upload/" render={props => isLoggedIn ? <UploadPage/> : <LoginPage/>}/>
              <Route path="/analytics/"
                     render={props => isLoggedIn ? <AnalyticsPage/> : <LoginPage/>}/>
              <Route path="/training/"
                     render={props => isLoggedIn ? <TrainingPage/> : <LoginPage/>}/>
              <Route path="/training/"
                     render={props => isLoggedIn ? <TrainingPage/> : <LoginPage/>}/>
              <Route path="/livediktering/"
                     render={props => isLoggedIn ? <LiveDikteringPage/> : <LoginPage/>}/>
              <Route path="/login"
                render={props => isLoggedIn ? <StartPage {...{
                  ...props,
                  transcripts
                }} /> : <LoginPage/>}/>
            </Switch>
          </EuiPage>
        </PreferencesProvider>
      </HashRouter>
    )
  }
}
