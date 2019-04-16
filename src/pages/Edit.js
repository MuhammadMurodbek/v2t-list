import React, { Component, Fragment } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiComboBox,
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
    numberOfWords: '3',
    keywords: [{ label: 'Symptom' }, { label:'Status' }, { label: 'Diagnos' }],
    isFlyoutVisible: false,
    originalChapters: null,
    currentTime: 0,
    queryTerm: ''
  }

  componentDidMount() {
    const { transcript } = this.props
    this.playerRef = React.createRef()
    if (transcript)
      this.loadSegments()
  }

  componentDidUpdate(prevProps) {
    const { transcript } = this.props
    const prevId = prevProps.transcript && prevProps.transcript.id
    if (transcript && transcript.id !== prevId)
      this.loadSegments()
  }

  loadSegments = async () => {
    const { transcript } = this.props
    const { numberOfWords } = this.state
    const queryString = `/api/v1/transcription/${transcript.id}?segmentLength=${numberOfWords}`
    const response = await axios.get(queryString)
    const originalChapters = this.parseTranscriptions(response.data.transcriptions)
    this.setState({ originalChapters })
  }

  parseTranscriptions = (transcriptions) => {
    if (transcriptions) {
      return transcriptions.map((transcript) => {
        const keyword = transcript.keyword.length ? transcript.keyword : 'general'
        const segments = transcript.segments.map((chunk, i) => {
          const words = i >= transcript.segments.length - 1 ? chunk.words : `${chunk.words} `
          return { ...chunk, words }
        })
        return { ...transcript, keyword, segments }
      })
    }
    return []
  }

  closeFlyout = () => {
    this.setState({ isFlyoutVisible: false })
  }

  showFlyout = () => {
    this.setState({ isFlyoutVisible: true })
  }

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
  }

  changeNumberOfWords = (numberOfWords) => {
    this.setState({ numberOfWords }, this.loadSegments)
  }

  changeKeywords = (keywords) => {
    this.setState({ keywords })
  }

  getCurrentTime = () => {
    this.playerRef.current.updateTime()
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText }, () => {
      this.playerRef.current.searchKeyword()
    })
  }

  render() {
    const { transcript } = this.props
    const {
      currentTime, isFlyoutVisible, numberOfWords, keywords, originalChapters,
      queryTerm
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
                  keywords={keywords}
                  onClose={this.closeFlyout}
                  onChangeWords={this.changeNumberOfWords}
                  onChangeKeywords={this.changeKeywords}
                />
              </Fragment>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <figure>
                <Player
                  audioTranscript={originalChapters}
                  trackId={transcript.id}
                  getCurrentTime={this.getCurrentTime}
                  updateSeek={this.onTimeUpdate}
                  queryTerm={queryTerm}
                  isPlaying={false}
                  ref={this.playerRef}
                />
                <EuiSpacer size="m" />
                <EuiSpacer size="m" />
                <EuiSpacer size="m" />
                {/* <audio
                  controls
                  src={`/api/v1/transcription/${transcript.id}/audio`}
                  ref={this.ref}
                  onTimeUpdate={this.onTimeUpdate}
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
              <Editor
                transcript={transcript}
                originalChapters={originalChapters}
                currentTime={currentTime}
                keywords={keywords.map(keyword => keyword.label.toLowerCase())}
                onSelect={this.onSelectText} />
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
  visible, keywords, words, onClose, onChangeWords, onChangeKeywords
}) => {
  if (!visible) return null
  const options = [
    { id: '1', label: '1' },
    { id: '3', label: '3' },
    { id: '5', label: '5' }
  ]
  const onCreateKeyword = keyword => {
    keywords.push({ label: keyword })
    onChangeKeywords(keywords)
  }
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
          <EuiFormRow label="Highlighted Number of Words">
            <EuiRadioGroup options={options} idSelected={words} onChange={onChangeWords} />
          </EuiFormRow>
          <EuiFormRow label="Chapter names">
            <EuiComboBox
              noSuggestions
              placeholder="Chapter names are mapped to the journal system"
              selectedOptions={keywords}
              onCreateOption={onCreateKeyword}
              onChange={onChangeKeywords}
            />
          </EuiFormRow>
        </Fragment>
      </EuiFlyoutBody>
    </EuiFlyout>
  )
}
