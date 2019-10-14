/* eslint-disable react/prop-types */
/* eslint-disable camelcase */
/* eslint-disable no-alert */
import React, { Component } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiButton
} from '@elastic/eui'
import api from '../api'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Player from '../components/Player'
import Templates from '../components/Templates'
import Info from '../components/Info'

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
    fields: {
      patient_id: '',
      patient_full_name: ''
    },
    isMediaAudio: true,
    originalTags: []
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
    // const [preferences] = this.context
    // const { words } = preferences
    const response = await api.loadTranscription(transcript.external_id)
    const originalChapters = this.parseTranscriptions(response.data.transcriptions)
    const { tags, fields, media_content_type } = response.data
    if (tags) {
      this.setState({
        originalChapters,
        tags,
        originalTags: tags
      })
    } else {
      this.setState({
        originalChapters,
        tags: []
      })
    }

    if (fields) {
      this.setState({ fields })
    } else {
      this.setState({
        fields: {
          patient_id: '',
          patient_full_name: ''
        }
      })
    }

    if (media_content_type) {
      if (media_content_type.match(/^video/) !== null) {
        this.setState({ isMediaAudio: false })
      }
    }
  }

  parseTranscriptions = (transcriptions) => {
    if (transcriptions) {
      return transcriptions.map((transcript) => {
        const keyword = transcript.keyword.length ? transcript.keyword : 'Kontaktorsak'
        const segments = transcript.segments.map((chunk, i) => {
          const words = i >= transcript.segments.length - 1 ? chunk.words : `${chunk.words} `
          return {
            ...chunk,
            words
          }
        })
        return {
          ...transcript,
          keyword,
          segments
        }
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
    const selctedText = window.getSelection()
      .toString()
    this.setState({ queryTerm: selctedText }, () => {
      this.playerRef.current.searchKeyword()
    })
  }

  finalize = async () => {
    const {
      originalChapters,
      chapters,
      tags,
      originalTags
    } = this.state

    if (JSON.stringify(originalChapters) === JSON.stringify(chapters) && JSON.stringify(tags) === JSON.stringify(originalTags)) {
      this.sendToCoworker()
    } else {
      await this.save()
      this.sendToCoworker()
    }
  }

  sendToCoworker = async () => {
    const { transcript } = this.props
    const sendingToCoworker = await api.approveTranscription(transcript.external_id)
      .catch(this.trowAsyncError)
    if (sendingToCoworker) {
      window.location = '/'
    } else {
      alert('Unable to send to the co-worker')
    }
  }

  throwAsyncError = (e) => {
    alert(e)
    throw new Error(e)
  }

  save = async () => {
    const { transcript } = this.props
    const { originalChapters, chapters, tags, errors, originalTags } = this.state
    if (JSON.stringify(originalChapters) === JSON.stringify(chapters) && JSON.stringify(tags) === JSON.stringify(originalTags)) {
      alert('Nothing to update')
      return
    }

    chapters.forEach((chapter) => {
      if (!chapter.segments[0].words.includes(chapter.keyword)) {
        chapter.segments[0].words = `${chapter.keyword} ${chapter.segments[0].words}`
      }
    })

    chapters.forEach((chapter) => {
      chapter.segments.forEach((segment) => {
        segment.words = segment.words.replace(/\./g, ' punkt ')
        segment.words = segment.words.replace(/,/g, ' komma ')
        segment.words = segment.words.replace(/:/g, ' kolon ')
        segment.words = segment.words.replace(/%/g, ' procent ')
        segment.words = segment.words.replace(/\?/g, ' frågetecken ')
        segment.words = segment.words.replace(/!/g, ' utropstecken ')
        segment.words = segment.words.replace(/\(/g, ' parentes ')
        segment.words = segment.words.replace(/\)/g, ' slut parentes ')
      })
    })

    if (errors.length) return false
    api.updateTranscription(transcript.external_id, tags, chapters)
      .then(() => {
        this.setState({
          originalChapters: chapters,
          originalTags: tags
        }, () => {
          alert('Transcript is updated')
          return true
        })
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error)
        return false
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
      isMediaAudio,
      fields
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
                <EuiSpacer size="l"/>
                <EuiSpacer size="l"/>
                <Info fields={fields}/>
              </figure>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="l"/>
          <EuiSpacer size="l"/>

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
              <EuiFlexGroup>
                <EuiFlexItem>
                  <Tags
                    tags={tags}
                    updateTags={this.onUpdateTags}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiSpacer size="m" />
                  <EuiSpacer size="m" />
                  <EuiSpacer size="m" />
                  <Templates />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="secondary" onClick={this.finalize}>Submit to
                Co-worker</EuiButton>
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
