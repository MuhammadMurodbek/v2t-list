import React, { Component } from 'react'
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui'

import Page from '../components/Page'
import Editor from '../components/Editor'
import Tags from '../components/Tags'

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
    if (!transcript) return null
    return (
      <Page title="Editor">
        {
          <div>
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
                    Your browser does not support the
                    <code>audio</code>
                    element.
                  </audio>
                </figure>
              </EuiFlexItem>
            </EuiFlexGroup>
            <br />
            <br />
            <br />
            <EuiFlexGroup wrap>
              <EuiFlexItem>
                <Editor transcript={subtitles} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <Tags values={transcript.tags} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        }
      </Page>
    )
  }
}

const Subtitle = ({ text, start, end, currentTime }) => {
  const isCurrent = currentTime <= start || currentTime > end
  if (isCurrent) return <span>{text}</span>
  return (
    <span style={{ fontWeight: 'bold', backgroundColor: '#FFFF00' }}>
      {text}
    </span>
  )
}
