import React, { Component } from 'react'
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui'
import axios from 'axios'
import Page from '../components/Page'
import Editor from '../components/Editor'
import Tags from '../components/Tags'

export default class EditPage extends Component {
  static defaultProps = {
    transcript: null
  }

  state = {
    subtitles: null,
    track: null
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.loadSubtitles()
  }

  componentDidUpdate(prevProps) {
    if (this.props.transcript !== prevProps.transcript)
      this.loadSubtitles()
    }

  loadSubtitles = () => {
    const { transcript } = this.props
    let id
    if (transcript) {
      id = transcript.id
      if (id) { this.setState({ track: id })}
    }

    if (!id) return null

    const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null

    const queryString = `/api/v1/transcription/${id}`
    axios.get(queryString)
      .then((response) => {
        const subtitles = response.data.transcriptions[0]
          .segments.map((subtitle, i) => (
            <Subtitle
              key={i} 
              words={subtitle.words}
              startTime={subtitle.startTime}
              endTime={subtitle.endTime}
              currentTime={currentTime}
            />
          ))
        this.setState({ subtitles })
      })
      .catch((error) => {
        // handle error
        console.log(error)
      })
  }

  updateSubtitles = () => {
    const { subtitles } = this.state
    // console.log('updating')
    console.log('subtitles start')
    console.log(subtitles)
    console.log('subtitles end')
    const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null

    if (subtitles) {
      const tempSubtitles = subtitles.map((subtitle, i) => (
        <Subtitle
          key={i}
          words={subtitle.props.words}
          startTime={subtitle.props.startTime}
          endTime={subtitle.props.endTime}
          currentTime={currentTime}
        />
      ))
      this.setState({ subtitles: tempSubtitles })
    }
  }

  render() {
    const { transcript } = this.props
    const { subtitles, track } = this.state
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
                    src={`/api/v1/transcription/${track}/audio`}
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

const Subtitle = ({words, startTime, endTime, currentTime}) => {
  const isCurrent = currentTime <= startTime || currentTime > endTime
  if (isCurrent) return <span>{words}&nbsp;</span>
  return (
    <span style={{ fontWeight: 'bold', backgroundColor: '#FFFF00' }}>
      {words}
      &nbsp;
    </span>
  )
}
