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
        console.log(error)
      })
  }

  parseTranscripts = data => data.map((d) => {
    d.transcript = d.words.map((word, i) => ({
      id: d.callId,
      text: `${word} `,
      start: d.startTimes[i],
      end: d.endTimes[i]
    }))
    return d
  })

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
              const transcript = transcripts.find(transcript => transcript.id === props.match.params.id)
              return <EditPage {...{...props, transcript}} />
            }} />
          </Switch>
        </EuiPage>
      </HashRouter>
    )
  }
}
