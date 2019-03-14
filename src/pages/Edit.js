import React, { Component } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiSelect,
  EuiText, EuiSpacer
} from '@elastic/eui'
import axios from 'axios'
import Page from '../components/Page'
import Editor from '../components/Editor'
import Tags from '../components/Tags'

export default class EditPage extends Component {
  static defaultProps = {
    transcript: null
  }

  options = [
    { value: '3', text: '3' },
    { value: '4', text: '4' },
    { value: '5', text: '5' }
  ]

  state = {
    subtitles: null,
    track: null,
    keywords: null,
    numberOfWords: this.options[0].value
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.loadSubtitles()
  }

  componentDidUpdate(prevProps) {
    if (this.props.transcript !== prevProps.transcript) {
      this.loadSubtitles()
    }
  }

  loadSubtitles = () => {
    const { transcript } = this.props
    const { numberOfWords } = this.state
    let id

    if (transcript) {
      id = transcript.id
      if (id) { this.setState({ track: id })}
    }

    if (!id) return null
    const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null
    const queryString = `/api/v1/transcription/${id}?segmentLength=${numberOfWords}`
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
        this.setState({ keywords: response.data.transcriptions[0].keywords})
      })
      .catch((error) => {
        // handle error
        this.setState({ subtitles: null })
      })
  }

  updateSubtitles = () => {
    const { subtitles } = this.state
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

  changeNumberOfWords = (e) => {
    this.setState({ numberOfWords: e.target.value }, () => {
      this.loadSubtitles()
    })
  }

  render() {
    const { transcript } = this.props
    const { subtitles, track, keywords } = this.state
    if (!transcript) return null
    return (
      <Page title="Editor">
        {
          <div>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false} style={{width: '150px'}}>
                <EuiText><h4>Number of words</h4></EuiText>
                <EuiSelect
                  options={this.options}
                  value={this.state.numberOfWords}
                  onChange={this.changeNumberOfWords}
                  aria-label="Use aria labels when no actual label is in use"
                />
                <EuiSpacer size="m" />
              </EuiFlexItem>
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
                <Editor transcript={subtitles} id={transcript.id} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <Tags values={keywords} />
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
