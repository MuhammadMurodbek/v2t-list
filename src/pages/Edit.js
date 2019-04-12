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
    numberOfWords: '3',
    isFlyoutVisible: false,
    originalTranscript: {
      segments: []
    },
    currentTime: 0,
    searchTerm: ''
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.player = React.createRef()
    this.loadSubtitles()
  }

  componentDidUpdate(prevProps) {
    const { transcript } = this.props
    if (transcript !== prevProps.transcript) {
      this.loadSubtitles()
    }
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
    const originalSubtitles = await axios.get(queryStringForAudio)
    const [originalTranscript] = originalSubtitles.data.transcriptions
    const subtitles = this.parseSubtitles(response.data.transcriptions)
    this.setState({ subtitles, originalTranscript })
    return true
  }

  parseSubtitles = transcripts => transcripts.reduce((subtitles, transcript) => {
    const parsedSubtitles = subtitles
    parsedSubtitles[transcript.keyword] = this.parseSubtitle(transcript)
    return parsedSubtitles
  }, {})

  parseSubtitle = (transcript) => {
    const { currentTime } = this.state
    return transcript.segments.map((subtitle, i) => (
      <Subtitle
        key={`key-${i + 1}`}
        words={subtitle.words}
        startTime={subtitle.startTime}
        endTime={subtitle.endTime}
        currentTime={currentTime}
        updateSeek={this.updateSeek}
      />
    ))
  }


  updateSeek= (currentTime) => {
    this.setState({ currentTime }, () => {
      this.updateSubtitles()
    })
  }

  updateSubtitles = () => {
    const { subtitles, currentTime } = this.state
    if (!subtitles) return
    const updatedSubtitles = Object.assign(...Object.entries(subtitles)
      .map(entry => this.updateSubtitle(entry, currentTime)))
    this.setState({ subtitles: updatedSubtitles })
  }

  updateSubtitle = ([key, subtitles], currentTime) => (
    {
      [key]: subtitles.map((subtitle,i) => <Subtitle key={i}  {...{ ...subtitle.props, currentTime }} />)
    }
  )

  changeNumberOfWords = (numberOfWords) => {
    this.setState({ numberOfWords }, this.loadSubtitles)
  }

  getCurrentTime = () => {
    this.player.current.updateTime()
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ searchTerm: selctedText }, () => {
      this.player.current.searchKeyword()
    })
  }

  render() {
    const { transcript } = this.props
    const {
      subtitles, isFlyoutVisible, numberOfWords, originalTranscript, searchTerm
    } = this.state
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
                  searchTerm={searchTerm}
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
              <Editor transcript={subtitles} id={transcript.id} onSelect={this.onSelectText} />
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

const Preferences = ({
  visible, words, onClose, onChange
}) => {
  if (!visible) return null
  const options = [
    { id: '1', label: '1' },
    { id: '3', label: '3' },
    { id: '5', label: '5' }
  ]
  return (
    <EuiFlyout onClose={onClose} aria-labelledby="flyoutTitle">
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

