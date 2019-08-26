/* eslint-disable no-console */
// eslint-disable-next-line no-console
import './App.css'
import '@elastic/eui/dist/eui_theme_light.css'

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

export default class App extends Component {
  static MENU_ITEMS = [
    {
      id: 0,
      name: '',
      items: [
        { id: 1, name: 'Start', href: '/#/' },
        { id: 2, name: 'Live Transcript', href: '/#/live' },
        { id: 3, name: 'Upload', href: '/#/upload' },
        { id: 4, name: 'Analytics', href: '/#/analytics' },
        { id: 5, name: 'Training', href: '/#/training' }
      ]
    }
  ]

  static ADVANCED_MENU_ITEMS = [
    {
      name: 'Kibana',
      id: 0,
      items: [
        {
          name: 'Advanced settings',
          id: 1,
          onClick: () => {
            // window.alert('Advanced settings');
          }
        },
        {
          name: 'Index Patterns (link)',
          id: 2,
          href: 'http://www.elastic.co'
        },
        {
          name: 'Saved Objects',
          id: 3,
          onClick: () => {
            // window.alert('Saved Objects');
          },
          isSelected: true
        },
        {
          name: 'Reporting',
          id: 4,
          onClick: () => {
            // window.alert('Reporting');
          }
        }
      ]
    }
  ]


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
    // axios.get('/api/v1/workflow', {
    // axios.get('/api/v1/tickets', {
    axios.get('/api/v1/tickets/tags/active', {
      params: {
        pageStart: 0,
        pageSize: 10,
        type: 'VOICE',
        sortBy: 'CREATED_DESC'
      }
    })
      .then((data) => {
        console.log('data')
        console.log(data.data)
        let activeTags = data.data
        const { selectedItemName } = this.state
        let sideBar = []
        activeTags.forEach((tag) => {
          let temp = {
            id: tag.value,
            name: tag.value,
            isSelected: selectedItemName === tag.value,
            onClick: () => {
              this.selectItem(tag.value)
              // change the value of transcript
              axios.get(`http://localhost:3000/api/v1/tickets?tags=${tag.value}`).then((receivedData) => {
                this.setState({transcripts: receivedData.data})
              })
            },
            href: '/#/'
            // href: `/`
          }
          sideBar.push(temp)
        })

        console.log('sidebar')
        console.log(sideBar)
        let parentSideBar = [
          {
            id: '',
            isSelected: false,
            items: [
              {
                id: 'V2T Jobs',
                items: sideBar,
                isSelected: true,
                name: 'V2T Jobs',
                onClick: () => this.selectItem('V2T Jobs')
              }, {
                href: '/#/live',
                id: 2,
                isSelected: selectedItemName === 'Live Transcript',
                name: 'Live Transcript',
                onClick: () => this.selectItem('Live Transcript')
              }, {
                href: '/#/upload',
                id: 3,
                isSelected: selectedItemName === 'Upload',
                name: 'Upload',
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
                name: 'Training',
                onClick: () => this.selectItem('Training')
              }
            ],
            name: ''
          }
        ]

        console.log('parent sidebar')
        console.log(parentSideBar)
        // this.setState({ sidenav: parentSideBar })
        this.setState({ sidenav: parentSideBar })
        // this.setState({ transcripts: data.data })
        // Create side nav
        
        // data.data.forEach((ticket) => {
        //   let temp = {
        //     id: name,
        //     name,
        //     isSelected: selectedItemName === name,
        //     onClick: () => this.selectItem(name)
        //   }
        // })
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
    }, () => {
      console.log('this.state.selectedItemName')
      console.log(this.state.selectedItemName)
    })
  }

  createItem = (name, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    const { selectedItemName } = this.state
    return {
      ...data,
      id: name,
      name,
      isSelected: selectedItemName === name,
      onClick: () => this.selectItem(name)
    }
  }

  render() {
    const { transcripts, preferences } = this.state
    const sideNav = [
      this.createItem('', {
        // icon: <EuiIcon type="logoKibana" />,
        items: [
          this.createItem('V2T Jobs', {
            items: [
              this.createItem('KS hjärta', { href: '/#/' }),
              this.createItem('KS lungor', { href: '/#/' }),
              this.createItem('SU ögon', { href: '/#/' }),
              this.createItem('SU hjärna', { href: '/#/' })
            ]
          }),
          this.createItem('Live Transcript', { href: '/#/live' }),
          this.createItem('Upload', { href: '/#/upload' }),
          this.createItem('Analytics', { href: '/#/analytics' }),
          this.createItem('Training', { href: '/#/training' })
        ]
      })
    ]
    console.log('previous sidenav')
    console.log(sideNav)

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
              {/* <EuiSideNav items={App.MENU_ITEMS} /> */}
              <EuiSideNav
                mobileTitle="Navigate within $APP_NAME"
                // toggleOpenOnMobile={false}
                isOpenOnMobile={false}
                style={{ width: 300 }}
                // items={App.ADVANCED_MENU_ITEMS}
                // items={sideNav}
                items={this.state.sidenav}
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
