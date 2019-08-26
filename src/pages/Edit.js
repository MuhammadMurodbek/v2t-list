/* eslint-disable no-alert */
import React, { Component } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiButton
} from '@elastic/eui'
import axios from 'axios'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Player from '../components/Player'

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    transcript: null
  }

  state = {
    originalChapters: null,
    currentTime: 0,
    queryTerm: '',
    tags: [],
    chapters: [],
    errors: [],
    isMediaAudio: true // should be prop
  }

  componentDidMount() {
    document.title = 'Inovia AI :: V2t Editor 🎤'
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
    const prevId = prevProps.transcript && prevProps.transcript.external_id
    if (transcript && transcript.external_id !== prevId) {
      this.loadSegments()
    }
  }

  loadSegments = async () => {
    const { transcript } = this.props
    const [preferences] = this.context
    const { words } = preferences
    const queryString = `/api/v1/transcription/${transcript.external_id}`
    // const queryString = '/api/v1/transcription/3db7df72-eef2-4b54-b0b0-d33589a406a7'
    const response = await axios.get(queryString)
    if (response) {
      console.log('hola')
      console.log(response)
      console.log('hola')
    } else {
      console.log('err')
    }
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

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
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
    const { transcript } = this.props
    const finalizeURL = `/api/v1/transcription/${transcript.external_id}/approve`
    const success = await this.save()
    if (success) {
      await axios.post(finalizeURL).catch(this.trowAsyncError)
      window.location = '/'
    } else {
      alert('Illegal keyword usage')
    }
  }

  throwAsyncError = (e) => {
    alert(e)
    throw new Error(e)
  }

  save = async () => {
    const { transcript } = this.props
    const { chapters, tags, errors } = this.state
    chapters.forEach((chapter) => {
      if (!chapter.segments[0].words.includes(chapter.keyword)) {
        chapter.segments[0].words = `${chapter.keyword} ${chapter.segments[0].words}`
      }
    })

    const updateURL = `/api/v1/transcription/${transcript.external_id}`
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
        // eslint-disable-next-line no-console
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

  cancel = () => {
    window.location.reload()
  }

  render() {
    const { transcript } = this.props
    const {
      currentTime,
      originalChapters,
      chapters,
      queryTerm,
      tags,
      isMediaAudio
    } = this.state
    if (!transcript) return null
    return (
      <Page preferences title="Editor">
        <div>
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <figure>
                <Player
                  audioTranscript={originalChapters}
                  trackId={transcript.external_id}
                  getCurrentTime={this.getCurrentTime}
                  updateSeek={this.onTimeUpdate}
                  queryTerm={queryTerm}
                  isPlaying={false}
                  isContentAudio={isMediaAudio}
                  ref={this.playerRef}
                  searchBoxVisible
                  isTraining={false}
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
                chapters={chapters}
                currentTime={currentTime}
                onSelect={this.onSelectText}
                updateTranscript={this.onUpdateTranscript}
                validateTranscript={this.onValidateTranscript}
                isDiffVisible
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
              <EuiButton fill color="secondary" onClick={this.finalize}>Submit to Co-worker</EuiButton>
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
