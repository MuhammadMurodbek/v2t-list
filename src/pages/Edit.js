import React, { Component } from 'react'
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui'

import Page from '../components/Page'
import Editor from '../components/Editor'

import Audio from '../audio/audio.wav'
import Transcript from '../audio/audiodesc.json'
import TranscriptSub from '../audio/audiodesc.vtt'

export default class EditPage extends Component {
  state = {
    transcript: null
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.updateSubtitles()
  }

  updateSubtitles = () => {
    const transcript = this.getSubtitles()
    this.setState({ transcript })
  }

  getSubtitles = () => {
    const currentTime = this.ref.current ? this.ref.current.currentTime : null

    return Transcript.map((d, i) => {
      if (currentTime > d.start && currentTime < d.end) {
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
    const callId = window.location.href.split('/').filter(function (s) { return !!s }).pop()
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
                  onTimeUpdate={this.updateSubtitles}
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
