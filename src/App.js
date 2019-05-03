import './App.css'
import '@elastic/eui/dist/eui_theme_light.css'

import React, { Component } from 'react'
import {
  HashRouter, Switch, Route, Link
} from 'react-router-dom'
import {
  EuiPage, EuiPageSideBar, EuiImage, EuiSideNav
} from '@elastic/eui'
import axios from 'axios'

import logo from './img/medspeech+Inovia_logo_rgb.png'

import StartPage from './pages/Start'
import EditPage from './pages/Edit'
import UploadPage from './pages/Upload'
import NewPage from './pages/New'
import LivePage from './pages/Live'

export default class App extends Component {
  static MENU_ITEMS = [
    {
      id: 0,
      name: '',
      items: [
        { id: 1, name: 'Start', href: '/#/' },
        { id: 2, name: 'Create', href: '/#/new' },
        { id: 3, name: 'Upload', href: '/#/upload' },
        {
          id: 4,
          name: 'Analytics',
          href: 'http://localhost:5601/app/kibana#/dashboards?_g=()',
          target: '_blank'
        },
        { id: 5, name: 'Live Transcript', href: '/#/live' }
      ]
    }
  ]

  state = {
    transcripts: []
  }

  componentDidMount() {
    this.fetchTranscripts()
  }

  fetchTranscripts = () => {
    axios.get('/api/v1/workflow', {
      params: {
        pageStart: 1,
        pageEnd: 10
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

  render() {
    const { transcripts } = this.state
    return (
      <HashRouter>
        <EuiPage>
          <EuiPageSideBar>
            <Link to="/">
              <EuiImage
                className="logo"
                size="m"
                alt="logo"
                url={logo}
                allowFullScreen
              />
            </Link>
            <EuiSideNav items={App.MENU_ITEMS} />
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
            <Route path="/upload/" component={UploadPage} />
            <Route path="/new/" component={NewPage} />
            <Route path="/live/" component={LivePage} />
          </Switch>
        </EuiPage>
      </HashRouter>
    )
  }
}
