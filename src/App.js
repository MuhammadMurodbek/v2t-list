import './App.css'
import '@elastic/eui/dist/eui_theme_light.css'

import React, { Component } from 'react'
import {
  HashRouter, Switch, Route, Link
} from 'react-router-dom'
import { EuiPage, EuiPageSideBar, EuiImage } from '@elastic/eui'
import axios from 'axios'

import logo from './logo.png'
import StartPage from './pages/Start'
import EditPage from './pages/Edit'

export default class App extends Component {

  state = {
    transcripts: []
  }

  componentDidMount() {
    this.fetchTranscripts()
  }

  fetchTranscripts = () => {
    axios.get('/api/v1/v2t-storage/')
      .then(({ data }) => {
        const transcripts = this.parseTranscripts(data)
        console.log(transcripts)
        this.setState({ transcripts })
      })
  }

  parseTranscripts = (data) => {
    return data.map(data => {
      data.transcript = data.transcript.map((transcript, i) => ({
        id: data.callId,
        text: transcript,
        start: data.startTimes[i],
        end: data.endTimes[i]
      }))
      return data
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
          </EuiPageSideBar>
          <Switch>
            <Route exact path="/" render={props => <StartPage {...{...props, transcripts}} /> } />
            <Route path="/edit/:id" render={props => {
              const transcript = transcripts.find(transcript => transcript.callId === props.match.params.id)
              return <EditPage {...{...props, transcript}} />
            }} />
          </Switch>
        </EuiPage>
      </HashRouter>
    )
  }
}
