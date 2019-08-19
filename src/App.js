import './App.css'
import '@elastic/eui/dist/eui_theme_light.css'

import React, { Component } from 'react'
import {
  HashRouter, Switch, Route
} from 'react-router-dom'
import {
  EuiPage, EuiPageSideBar, EuiImage, EuiSideNav, EuiIcon
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
            window.alert('Advanced settings');
          },
        },
        {
          name: 'Index Patterns (link)',
          id: 2,
          href: 'http://www.elastic.co',
        },
        {
          name: 'Saved Objects',
          id: 3,
          onClick: () => {
            window.alert('Saved Objects');
          },
          isSelected: true,
        },
        {
          name: 'Reporting',
          id: 4,
          onClick: () => {
            window.alert('Reporting');
          },
        },
      ],
    },
  ];


  state = {
    transcripts: [],
    preferences: new Preference(),
    isSideNavOpenOnMobile: false,
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
    axios.get('/api/v1/workflow', {
      params: {
        pageStart: 0,
        pageSize: 10,
        type: 'VOICE',
        sortBy: 'CREATED_DESC'
      }
    })
      .then((data) => {
        // const transcripts = data
        // const transcripts = this.parseTranscripts(data)
        this.setState({ transcripts: data.data })
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
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
  };

  createItem = (name, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: name,
      name,
      isSelected: this.state.selectedItemName === name,
      onClick: () => this.selectItem(name),
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
          this.createItem('Training', {
            items: [
              this.createItem('Träna KS hjärta', { href: '/#/' }),
              this.createItem('Träna KS lungor', { href: '/#/' }),
              this.createItem('Träna SU ögon', { href: '/#/' }),
              this.createItem('Träna SU hjärna', { href: '/#/' })
            ]
          })]
      })
    ]

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
                toggleOpenOnMobile={false}
                isOpenOnMobile={false}
                style={{ width: 300 }}
                // items={App.ADVANCED_MENU_ITEMS}
                items={sideNav}
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
