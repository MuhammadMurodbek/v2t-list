/* eslint-disable no-console */
// eslint-disable-next-line no-console
import React, { Component } from 'react'
import {
  HashRouter, Switch, Route
} from 'react-router-dom'
import {
  EuiPage, EuiPageSideBar, EuiImage, EuiSideNav
} from '@elastic/eui'
import axios from 'axios'
import logo from './img/medspeech+Inovia_logo_rgb.png'
import PreferencesProvider from './components/PreferencesProvider'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import LivePage from './pages/Live'
import UploadPage from './pages/Upload'
import AnalyticsPage from './pages/Analytics'
import TrainingPage from './pages/Training'
import Preference from './models/Preference'
import './App.css'
export default class App extends Component {
  state = {
    transcripts: [],
    preferences: new Preference(),
    selectedItemName: 'lungor'
  }

  componentDidMount() {
    this.fetchTranscripts()
  }

  setPreferences = (state) => {
    const { preferences } = this.state
    this.setState({ preferences: preferences.clone().add(state) })
  }

  fetchTranscripts = () => {
    axios.get('/api/v2/tickets?pageSize=200')
      .then((data) => {
        // Check which one are audio and which are video before loading all active jobs
        const updatedTranscripts = data.data
        data.data.forEach((transcript, i) => {
          axios
            .get(`/api/v1/transcription/${transcript.external_id}/audio`)
            .then((content) => {
              updatedTranscripts[i] = { ...updatedTranscripts[i], ...{ contentType: content.headers['content-type'] } }
            })
        })
        this.setState({ transcripts: updatedTranscripts })
      })
    axios.get('/api/v1/tickets/tags/active', {
      params: {
        pageStart: 0,
        pageSize: 10000,
        type: 'VOICE',
        sortBy: 'CREATED_DESC'
      }
    })
      .then((data) => {
        const activeTags = data.data
        // Count number of active tags
        const { selectedItemName, transcripts } = this.state
        const sideBar = []
        activeTags.forEach((tag) => {
          const temp = {
            id: tag.value,
            name: `${tag.value} (${tag.count})`,
            isSelected: selectedItemName === tag.value,
            onClick: () => {
              this.selectItem(tag.value)
              axios.get(`/api/v2/tickets?tags=${tag.value}&pageSize=200`).then((receivedData) => {
                // transcripts after job selection
                // Check which one are audio and which are video
                const updatedTranscripts = receivedData.data
                updatedTranscripts.forEach((activeJob, i) => {
                  if (transcripts.external_id === activeJob.external_id) {
                    updatedTranscripts[i] = { ...updatedTranscripts[i], ...{ contentType: transcripts[i].contentType } }
                  }
                })
                // console.log('ååååå')
                // console.log(updatedTranscripts)
                // console.log('ååååå')
                // receivedData.data.forEach((transcript, i) => {
                //   axios
                //     .get(`/api/v1/transcription/${transcript.external_id}/audio`)
                //     .then((content) => {
                //       // updatedTranscripts[i].contentType = content.headers['content-type']
                //       updatedTranscripts[i] = { ...updatedTranscripts[i], ...{ contentType: content.headers['content-type'] } }
                //     })
                // })
                this.setState({ transcripts: updatedTranscripts })
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
                name: 'V2T Jobs'
              }, {
                href: '/#/live',
                id: 2,
                isSelected: selectedItemName === 'Live Transcript',
                name: 'Live Diktering',
                onClick: () => this.selectItem('Live Transcript')
              }, {
                href: '/#/upload',
                id: 3,
                isSelected: selectedItemName === 'Upload',
                name: 'Ladda Upp',
                onClick: () => this.selectItem('Upload')
              }, {
                href: '/#/analytics',
                id: 4,
                isSelected: selectedItemName === 'Analytics',
                name: 'Analytics',
                onClick: () => this.selectItem('Analytics')
              }, {
                href: '/#/training',
                id: 5,
                isSelected: selectedItemName === 'Training',
                name: 'Träning',
                onClick: () => this.selectItem('Training')
              }, {
                href: '/',
                id: 6,
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

  loadHomescreen = () => {
    window.location.replace('/')
  }

  selectItem = (name) => {
    this.setState({
      selectedItemName: name
    })
  }

  render() {
    const { transcripts, preferences, sidenav } = this.state
    return (
      <HashRouter>
        <PreferencesProvider value={[preferences, this.setPreferences]}>
          <EuiPage>
            <EuiPageSideBar>
              <EuiImage
                className="logo"
                size="m"
                alt="logo"
                url={logo}
                allowFullScreen
                onClick={this.loadHomescreen}
              />
              <EuiSideNav
                mobileTitle="Navigate within $APP_NAME"
                // toggleOpenOnMobile={false}
                isOpenOnMobile={false}
                style={{ width: 300 }}
                items={sidenav}
              />
            </EuiPageSideBar>
            <Switch>
              <Route exact path="/" render={props => <StartPage {...{ ...props, transcripts }} />} />
              <Route
                path="/edit/:id"
                render={(props) => {
                  const transcript = transcripts
                    .find(currentTranscript => currentTranscript.id === props.match.params.id)
                  return <EditPage {...{ ...props, transcript }} />
                }}
              />
              <Route path="/live/" component={LivePage} />
              <Route path="/upload/" component={UploadPage} />
              <Route path="/analytics" component={AnalyticsPage} />
              <Route path="/training" component={TrainingPage} />
            </Switch>
          </EuiPage>
        </PreferencesProvider>
      </HashRouter>
    )
  }
}
