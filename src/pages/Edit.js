/* eslint-disable no-alert */
import React, { Component } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiButton,
  EuiForm, EuiText, EuiButtonIcon, EuiFieldText, EuiButtonEmpty
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
    isMediaAudio: true, // should be prop
    personnummer: '19121212-1212',
    patientName: 'Tolvan Tolvasson',
    isPersonnummerEditable: false,
    isPatientNameEditable: false
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
    const queryString = `/api/v1/transcription/${transcript.external_id}`
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
        const keyword = transcript.keyword.length ? transcript.keyword : 'Kontaktorsak'
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

  changePersonnummmerEditStatus = () => {
    const { isPersonnummerEditable } = this.state
    this.setState({ isPersonnummerEditable: !isPersonnummerEditable })
  }

  onPersonnumerChange = (e) => {
    this.setState({ personnummer: e.target.value })
  }

  changePatientNameEditStatus = () => {
    const { isPatientNameEditable } = this.state
    this.setState({ isPatientNameEditable: !isPatientNameEditable })
  }

  onPatientNameChange = (e) => {
    this.setState({ patientName: e.target.value })
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
      personnummer,
      isPersonnummerEditable,
      patientName,
      isPatientNameEditable
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
                <EuiSpacer size="l" />
                <EuiSpacer size="l" />

                <EuiForm>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <div className="euiText euiText--small">
                        <div>
                          <h2>
                            <span> Personnummer</span>
                          </h2>
                          <EuiText size="m">
                            <span
                              style={{ display: isPersonnummerEditable ? 'none' : 'flex' }}
                            >
                              {personnummer}
                              &nbsp;
                              <EuiButtonIcon
                                style={{ display: isPersonnummerEditable ? 'none' : 'flex' }}
                                iconType="pencil"
                                aria-label="Next"
                                color="danger"
                                onClick={this.changePersonnummmerEditStatus}
                              />
                            </span>
                          </EuiText>
                          <EuiFieldText
                            style={{ display: isPersonnummerEditable ? 'flex' : 'none' }}
                            onChange={this.onPersonnumerChange}
                            value={personnummer}
                            placeholder={personnummer}
                            aria-label="Use aria labels when no actual label is in use"
                          />
                          <EuiSpacer size="s" />
                          <EuiButtonEmpty
                            style={{ display: isPersonnummerEditable ? 'flex' : 'none' }}
                            onClick={this.changePersonnummmerEditStatus}
                          >
                          Save
                          </EuiButtonEmpty>
                        </div>
                      </div>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <div className="euiText euiText--small">
                        <div>
                          <h2>
                            <span>Patientnamn</span>
                          </h2>
                          <EuiText size="m">
                            <span
                              style={{ display: isPatientNameEditable ? 'none' : 'flex' }}
                            >
                              {patientName}
                              &nbsp;
                              <EuiButtonIcon
                                style={{ display: isPatientNameEditable ? 'none' : 'flex' }}
                                iconType="pencil"
                                aria-label="Next"
                                color="danger"
                                onClick={this.changePatientNameEditStatus}
                              />
                            </span>
                          </EuiText>
                          <EuiFieldText
                            style={{ display: isPatientNameEditable ? 'flex' : 'none' }}
                            onChange={this.onPatientNameChange}
                            value={patientName}
                            placeholder={patientName}
                            aria-label="Use aria labels when no actual label is in use"
                          />
                          <EuiSpacer size="s" />
                          <EuiButtonEmpty
                            style={{ display:  isPatientNameEditable ? 'flex' : 'none' }}
                            onClick={this.changePatientNameEditStatus}
                          >
                          Save
                          </EuiButtonEmpty>
                        </div>
                      </div>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiForm>
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
          <EuiSpacer size="l" />
          <EuiSpacer size="l" />

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
