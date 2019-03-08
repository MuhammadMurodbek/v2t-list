import React, { Component } from 'react'
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui'

import Page from '../components/Page'
import Editor from '../components/Editor'

import TranscriptSub from '../audio/audiodesc.vtt'

export default class EditPage extends Component {

  static defaultProps = {
    transcript: null
  }

  state = {
    subtitles: null
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.updateSubtitles()
  }

  componentDidUpdate(prevProps) {
    if (this.props.transcript !== prevProps.transcript)
      this.updateSubtitles()
  }

  updateSubtitles = () => {
    const { transcript } = this.props
    if (!transcript) return null
    const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null
    const subtitles = transcript.transcript.map((subtitle, i) => <Subtitle key={i} {...{...subtitle, currentTime}} />)
    this.setState({ subtitles })
  }

  render() {
    const { transcript } = this.props
    const { subtitles } = this.state
    if(!subtitles) return null
    return (
      <Page title="Editor">
        <EuiFlexGroup direction="column">
          <EuiFlexItem grow={false}>
            <figure>
              <audio
                controls
                src={`/api/v1/v2t-storage/audio/${transcript.callId}`}
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
            <Editor transcript={subtitles} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}

const Subtitle = ({ text, start, end, currentTime }) => {
  const isCurrent = currentTime <= start || currentTime > end
  if (isCurrent) return <span>{text}</span>
  return (
    <span style={{ fontWeight: 'bold', color: '#0079A5' }}>
      {text}
    </span>
  )
}
