import React, { Component } from 'react'
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui'
import axios from 'axios'

import Page from '../components/Page'
import Editor from '../components/Editor'
import TranscriptSub from '../audio/audiodesc.vtt'

export default class EditPage extends Component {
  state = {
    transcript: null,
    parsedTranscript: null
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.getSubtitles()
  }

  getSubtitles = () => {
    axios
      .get('/api/v1/v2t-storage/')
      .then((response) => {
        const temporaryScript = []
        for (let i = 0; i < response.data[0].words.length; i += 1) {
          temporaryScript.push({
            start: response.data[0].startTimes[i],
            end: response.data[0].endTimes[i],
            text: response.data[0].words[i]
          })
        }
        const scripture = this.getScripture(temporaryScript)
        this.setState({ parsedTranscript: temporaryScript })
        this.setState({ transcript: scripture })
      })
  }


  updateSubtitle = () => {
    const { parsedTranscript } = this.state
    const scripture = this.getScripture(parsedTranscript)
    this.setState({ transcript: scripture })
  }

  getScripture = (scripture) => {
    const currentTime = this.ref.current ? this.ref.current.currentTime : null

    return scripture.map((d, i) => {
      if (currentTime >= d.start && currentTime <= d.end) {
        return (
          <span
            key={i}
            style={{ fontWeight: 'bold', color: '#0079A5' }}
          >
            {d.text}&nbsp;
          </span>
        )
      }
      return (
        <span key={i}>
          {d.text} </span>
      )
    })
  }


  render() {
    const { transcript } = this.state
    const baseUrl = '/api/v1/v2t-storage/audio/'
    const callId = window.location.href.split('/').filter(s => !!s).pop()
    const url = `${baseUrl}${callId}`
    return (
      <Page title="Editor">
        {
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <figure>
                <audio
                  controls
                  src={url}
                  ref={this.ref}
                  onTimeUpdate={this.updateSubtitle}
                  style={{ width: '100%' }}
                >
                  <track
                    default
                    kind="captions"
                    srcLang="en"
                    src={TranscriptSub}
                  />
                  Your browser does not support the
                  <code>audio</code>
                  element.
                </audio>
              </figure>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <Editor transcript={transcript} />
            </EuiFlexItem>
          </EuiFlexGroup>}
      </Page>
    )
  }
}
