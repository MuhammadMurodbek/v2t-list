/* eslint-disable no-alert */
import React, { Component, Fragment } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiComboBox,
  EuiSpacer, EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader,
  EuiTitle, EuiIcon, EuiRadioGroup, EuiButton
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
    keywords: [{ label: 'Symptom' }, { label: 'Status' }, { label: 'Diagnos' }, { label: 'General' }],
    isFlyoutVisible: false,
    originalChapters: null,
    currentTime: 0,
    queryTerm: '',
    tags: [],
    chapters: [],
    errors: []
  }

  componentDidMount() {
    const { transcript } = this.props
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    if (transcript) {
      this.loadSegments()
    }
  }

  componentDidUpdate(prevProps) {
    const { transcript } = this.props
    const prevId = prevProps.transcript && prevProps.transcript.id
    if (transcript && transcript.id !== prevId) {
      this.loadSegments()
    }
  }

  loadSegments = async () => {
    const { transcript } = this.props
    const { numberOfWords } = this.state
    const queryString = `/api/v1/transcription/${transcript.id}?segmentLength=${numberOfWords}`
    const response = await axios.get(queryString)
    const originalChapters = this.parseTranscriptions(response.data.transcriptions)
    const { tags } = response.data
    if (tags) {
      this.setState({ originalChapters, tags })
    } else {
      this.setState({ originalChapters, tags: [] })
    }
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

  finalize = async () => {
    const success = await this.save()
    if (success) {
      window.location = '/'
    } else {
      alert('Illegal keyword usage')
    }
  }

  save = async () => {
    const { transcript } = this.props
    const { chapters, tags, errors } = this.state
    chapters.forEach((chapter) => {
      if (!chapter.segments[0].words.includes(chapter.keyword)) {
        chapter.segments[0].words = `${chapter.keyword} ${chapter.segments[0].words}`
      }
    })

    const updateURL = `/api/v1/transcription/${transcript.id}`
    console.log('chapters')
    console.log(chapters, tags)

    if (errors.length) return false
    return axios.put(updateURL,
      {
        tags,
        transcriptions: chapters
      })
      .then(() => {
        alert('Transcript is updated')
        return true
      })
      .catch((error) => {
        console.log(error)
      })
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  onUpdateTranscript = (chapters) => {
    this.setState({ chapters })
  }

  onValidateTranscript = (errors) => {
    this.setState({ errors })
  }

  render() {
    const { transcript } = this.props
    const {
      currentTime, isFlyoutVisible, numberOfWords, keywords, originalChapters,
      queryTerm, tags
    } = this.state

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
                onSelect={this.onSelectText}
                updateTranscript={this.onUpdateTranscript}
                validateTranscript={this.onValidateTranscript}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <Tags
                tags={tags}
                updateTags={this.onUpdateTags}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="secondary" onClick={this.finalize}>Finalize</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="secondary" onClick={this.save}>Save Changes</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="danger" onClick={this.cancel}>Cancel</EuiButton>
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
  const onCreateKeyword = (keyword) => {
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
