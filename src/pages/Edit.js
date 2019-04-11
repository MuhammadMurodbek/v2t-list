import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup, EuiFlexItem,
  EuiSpacer, EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader,
  EuiTitle, EuiIcon, EuiRadioGroup
} from '@elastic/eui'
import axios from 'axios'
import Page from '../components/Page'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Player from '../components/Player'

export default class EditPage extends Component {
  static defaultProps = {
    transcript: null
  }

  state = {
    subtitles: null,
    tags: null,
    numberOfWords: '3',
    isFlyoutVisible: false, 
    originalTranscript: {
      segments: []
    },
    currentTime: 0 
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.player = React.createRef()
    this.loadSubtitles()
    this.loadIcdCodes()
  }

  componentDidUpdate(prevProps) {
    if (this.props.transcript !== prevProps.transcript) {
      this.loadSubtitles()
    }
  }

  loadIcdCodes = async() => {
    const codeData = await axios.post('/api/v1/code-service/search', {
      text: 'N905A postmenopausal blödning hos icke hormonbehandlad kvinna'
    })
  }

  closeFlyout = () => {
    this.setState({ isFlyoutVisible: false })
  }

  showFlyout = () => {
    this.setState({ isFlyoutVisible: true })
  }

  loadSubtitles = async () => {
    const { transcript } = this.props
    const { numberOfWords } = this.state
    if (!transcript) return null
    const queryString = `/api/v1/transcription/${transcript.id}?segmentLength=${numberOfWords}`
    const response = await axios.get(queryString)
    const queryStringForAudio = `/api/v1/transcription/${transcript.id}`
    let originalTranscript = await axios.get(queryStringForAudio)
    originalTranscript = originalTranscript.data.transcriptions[0]
    const subtitles = this.parseSubtitles(response.data.transcriptions)
    const tags = response.data.tags
    this.setState({ subtitles, tags, originalTranscript })
  }

  parseSubtitles = transcripts => {
    return transcripts.reduce((subtitles, transcript) => {
      subtitles[transcript.keyword] = this.parseSubtitle(transcript)
      return subtitles
    }, {})
  }

  parseSubtitle = transcript => {
    // const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null
    const currentTime = this.state.currentTime
    return transcript.segments.map((subtitle, i) => (
      <Subtitle
        key={i}
        words={subtitle.words}
        startTime={subtitle.startTime}
        endTime={subtitle.endTime}
        currentTime={currentTime}
        updateSeek={this.updateSeek}
      />
    ))
  }


  updateSeek= (currentTime) => {
    this.setState({ currentTime }, ()=>{
      this.updateSubtitles()
    })
  }
  updateSubtitles = () => {
    if (!this.state.subtitles) return
    // const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null
    const currentTime = this.state.currentTime
    const subtitles = Object.assign(...Object.entries(this.state.subtitles)
      .map(entry => this.updateSubtitle(entry, currentTime)))
    this.setState({ subtitles })
  }

  updateSubtitle = ([key, subtitles], currentTime) => (
    {
      [key]: subtitles.map(subtitle => <Subtitle {...{...subtitle.props, currentTime}} />)
    }
  )

  changeNumberOfWords = (numberOfWords) => {
    this.setState({ numberOfWords }, this.loadSubtitles)
  }

  getCurrentTime = () => {
    this.player.current.updateTime()
  }


  render() {
    const { transcript } = this.props
    const { subtitles, track, tags, isFlyoutVisible, numberOfWords, originalTranscript } = this.state
    const dummyCode = [
      {
        _index: 'icd.codes',
        _type: '_doc',
        _id: 'N950A',
        _score: 95.074844,
        _source: {
          CodeText: 'Postmenopausal blödning hos icke hormonbehandlad kvinna',
          CategoryCode: 'N95',
          CategoryName: 'Sjukliga tillstånd i samband med klimakteriet',
          Code: 'N950A'
        }
      },
      {
        _index: 'icd.codes',
        _type: '_doc',
        _id: 'N734',
        _score: 33.49643,
        _source: {
          CodeText: 'Kronisk bäckenperitonit hos kvinna',
          CategoryCode: 'N73',
          CategoryName: 'Andra inflammatoriska sjukdomar i det kvinnliga bäckenet',
          Code: 'N734'
        }
      }
    ]

    if (!transcript) return null
    return (
      <Page title="Editor">
        <div>
          <EuiFlexGroup direction="column" alignItems="flexEnd">
            <EuiFlexItem grow style={{ width: '150px' }}>
              <Fragment>
                <EuiIcon
                  type="gear"
                  size="xl"
                  className="gear"
                  onClick={this.showFlyout}
                />
                <Preferences
                  visible={isFlyoutVisible}
                  words={numberOfWords}
                  onClose={this.closeFlyout}
                  onChange={this.changeNumberOfWords}
                />
              </Fragment>
            </EuiFlexItem>
          </EuiFlexGroup>
          <br />
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <figure>
                <Player
                  audioTranscript={originalTranscript}
                  trackId={transcript.id}
                  getCurrentTime={this.getCurrentTime}
                  updateSeek={this.updateSeek}
                  isPlaying={false}
                  ref={this.player}
                />
                <EuiSpacer size="m" />
                <EuiSpacer size="m" />
                <EuiSpacer size="m" />
                {/* <audio
                  controls
                  src={`/api/v1/transcription/${transcript.id}/audio`}
                  ref={this.ref}
                  onTimeUpdate={this.updateSubtitles}
                  style={{ width: '100%' }}
                >
                  Your browser does not support the
                  <code>audio</code>
                  element.
                </audio> */}
              </figure>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <Editor transcript={subtitles} id={transcript.id} />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <Tags values={dummyCode} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </Page>
    )
  }
}

const Preferences = ({ visible, words, onClose, onChange }) => {
  if (!visible) return null
  const options = [
    { id: `1`, label: '1' },
    { id: `3`, label: '3' },
    { id: `5`, label: '5'}
  ]
  return (
    <EuiFlyout onClose={onClose} aria-labelledby="flyoutTitle" >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h4 id="flyoutTitle">
            Preferences
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <Fragment>
          <h5 id="flyoutTitle">
            Highlighted Number of Words
          </h5>
          <EuiSpacer size="m" />
          <EuiRadioGroup options={options} idSelected={words} onChange={onChange} />
        </Fragment>
      </EuiFlyoutBody>
    </EuiFlyout>
  )
}

const Subtitle = ({
  words, startTime, endTime, currentTime
}) => {
  const notCurrent = currentTime <= startTime || currentTime > endTime
  if (notCurrent) return <span>{`${words} `}</span>
  return (
    <span style={{ fontWeight: 'bold', backgroundColor: '#FFFF00' }}>
      {`${words} `}
    </span>
  )
}

Subtitle.propTypes = {
  words: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  currentTime: PropTypes.string.isRequired
}
