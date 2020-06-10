// @ts-nocheck
/* eslint-disable no-console */
/* eslint-disable react/prop-types */
/* eslint-disable camelcase */
/* eslint-disable no-alert */
import React, { Component } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
  EuiI18n
} from '@elastic/eui'
import Invalid from './Invalid'
import api from '../api'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Player from '../components/Player'
import Schemas from '../components/Schemas'
import Info from '../components/Info'
import Sidenote from '../components/Sidenote'
import processChaptersRegular from '../models/processChaptersRegular'
import {
  addUnexpectedErrorToast,
  addErrorToast,
  addGlobalToast,
  addWarningToast,
  addSuccessToast
} from '../components/GlobalToastList'
// import processChapters from '../models/processChapters'

const EMPTY_TRANSCRIPTIONS = [{ keyword: '', segments: [] }]

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    id: -1,
    preloadedTranscript: null
  }

  state = {
    sidenoteContent: '',
    originalChapters: null,
    currentTime: 0,
    queryTerm: '',
    tags: [],
    chapters: [],
    fields: {},
    isMediaAudio: true,
    originalTags: [],
    schemas: [],
    schemaId: '',
    originalSchemaId: '',
    sectionHeaders: [],
    initialCursor: 0
  }

  componentDidMount() {
    document.title = 'Inovia AI :: V2t Editor 🎤'
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    this.initiate()
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props
    if (id !== prevProps.id) {
      this.initiate()
    }
  }

  initiate = async () => {
    const { id, defaultTranscript } = this.props
    if (defaultTranscript) await this.onNewTranscript(defaultTranscript)
    const [
      {
        data: { schemas }
      },
      { data: transcript }
    ] = await Promise.all([
      api.getSchemas().catch(this.onError),
      api.loadTranscription(id).catch(this.onError)
    ])
    this.onNewTranscript(transcript, schemas)
  }

  onNewTranscript = async (transcript, schemas) => {
    localStorage.setItem('transcriptId', this.props.id)
    const {
      tags,
      fields,
      media_content_type,
      schemaId,
      transcriptions
    } = transcript
    const originalTags = (tags || []).map((tag) => ({
      ...tag,
      id: tag.id.toUpperCase()
    }))
    const { data: schema } = await api.getSchema(schemaId).catch(this.onError) || {}

    this.setState({
      originalSchemaId: schemaId,
      originalChapters: this.parseTranscriptions(transcriptions),
      originalTags,
      tags: originalTags,
      fields: fields || {},
      isMediaAudio: (media_content_type || '').match(/^video/) === null,
      schemas,
      schemaId,
      sectionHeaders: (schema.fields || []).map(({ name }) => name)
    })
  }

  parseTranscriptions = (transcriptions) => {
    if (!transcriptions) return EMPTY_TRANSCRIPTIONS
    return transcriptions.map((transcript) => {
      const keyword = transcript.keyword.length
        ? transcript.keyword
        : 'Kontaktorsak'
      const segments = transcript.segments.map((chunk, i) => {
        const sentenceCase =
          i > 0
            ? chunk.words
            : `${chunk.words.charAt(0).toUpperCase()}${chunk.words.slice(1)}`
        const isLast = i >= transcript.segments.length - 1
        const noSpaceSuffix = isLast || /^\s*$/.test(sentenceCase)
        const words = noSpaceSuffix ? sentenceCase : `${sentenceCase} `
        return {
          ...chunk,
          words: words.replace(/ +$/, ' ')
        }
      })
      return {
        ...transcript,
        keyword,
        segments
      }
    })
  }

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
  }

  onCursorTimeChange = (cursorTime) => {
    this.setState({ cursorTime })
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
    const {
      originalChapters,
      chapters,
      tags,
      originalTags,
      fields,
      schemaId,
      originalSchemaId
    } = this.state
    if (fields.patient_id) {
      if (
        JSON.stringify(originalChapters) === JSON.stringify(chapters) &&
        JSON.stringify(tags) === JSON.stringify(originalTags) &&
        originalSchemaId === schemaId
      ) {
        this.sendToCoworker()
      } else {
        this.save(true)
      }
    } else {
      addErrorToast(
        <EuiI18n
          token="presonNumberIsMissing"
          default="Person number is missing"
        />,
        <EuiI18n
          token="unableToSendToCoWorker"
          default="Unbale to send to co-worker"
        />
      )
    }
  }

  sendToCoworker = async () => {
    const { id } = this.props
    try {
      const sendingToCoworker = await api.approveTranscription(id)
      if (sendingToCoworker) {
        window.location = '/'
      } else {
        addErrorToast(
          <EuiI18n
            token="unableToSendToCoWorker"
            default="Unbale to send to co-worker"
          />
        )
      }
    } catch {
      addUnexpectedErrorToast()
    }
  }

  save = async (shouldBeSentToCoworker = false) => {
    const { id } = this.props
    const {
      originalChapters,
      chapters,
      tags,
      originalTags,
      schemaId,
      originalSchemaId
    } = this.state
    
    const isThereAnyEmptySection = chapters.find(chapter=>chapter.segments.length === 0) || false
    if (isThereAnyEmptySection) {
      addWarningToast(
        <EuiI18n
          token="unableToSaveDictation"
          default="Unable to save the dictation"
        />,
        <EuiI18n
          token="emptySectionError"
          default="Section must not be empty"
        />
      )
      return
    }

    if (
      JSON.stringify(originalChapters) === JSON.stringify(chapters) &&
      JSON.stringify(tags) === JSON.stringify(originalTags) &&
      originalSchemaId === schemaId
    ) {
      addGlobalToast(
        <EuiI18n token="info" default="Info" />,
        <EuiI18n
          token="nothingToUpdate"
          default="There is nothing to update!"
        />,
        'info'
      )
      return
    }

    const headers = chapters.map((chapter) => chapter.keyword)
    const uniqueHeaders = Array.from(new Set(headers))
    const hasEmptyHeader = headers.some(header => !header)
    if (hasEmptyHeader || headers.length !== uniqueHeaders.length) {
      addWarningToast(
        <EuiI18n
          token="unableToSaveDictation"
          default="Unable to save the dictation"
        />,
        <EuiI18n
          token="keywordsError"
          default="All keywords must be set and may only appear once"
        />
      )
      return
    }

    chapters.forEach((chapter) => {
      chapter.segments.forEach((segment) => {
        if (/\s$/.test(segment.words)) {
          segment.words = segment.words.slice(0, -1)
        }
      })
    })

    try {
      await api.updateTranscription(id, tags, chapters, schemaId)
      this.setState(
        {
          originalChapters: this.parseTranscriptions(chapters),
          originalTags: tags
        },
        () => {
          addSuccessToast(
            <EuiI18n
              token="dictationUpdated"
              default="The dictation has been updated"
            />
          )
          if (shouldBeSentToCoworker === true) {
            this.sendToCoworker()
          }
          return true
        }
      )
    } catch {
      addUnexpectedErrorToast()
    }
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  updateSchemaId = async (schemaId) => {
    const { chapters } = this.state
    const { data: schema } = await api.getSchema(schemaId).catch(this.onError) || {}
    const availableSectionHeaders = this.getAvailableSectionHeaders(schema)
    const sectionHeaders = (schema.fields || []).map(({ name }) => name)
    const updatedChapters = processChaptersRegular(
      chapters,
      availableSectionHeaders
    )
    this.setState({ schemaId, sectionHeaders, chapters: updatedChapters })
  }

  getAvailableSectionHeaders = (schema) => {
    if (schema.fields)
      return schema.fields.reduce((store, { name, headerPatterns }) => {
        return [...store, name, ...(headerPatterns || [])]
      }, [])
  }

  onUpdateTranscript = (chapters) => {
    return new Promise((resolve) => this.setState({ chapters }, resolve))
  }

  onPause = () => {
    const { currentTime } = this.state
    const initialCursor = currentTime
    this.setState({ initialCursor })
  }

  cancel = () => {
    window.location = '/'
  }

  updateSidenote = () => {}

  onError = (error) => {
    this.setState({ error })
  }

  render() {
    const { id, token } = this.props
    const {
      currentTime,
      cursorTime,
      originalChapters,
      chapters,
      queryTerm,
      tags,
      isMediaAudio,
      fields,
      schemas,
      schemaId,
      sectionHeaders,
      initialCursor,
      sidenoteContent,
      error
    } = this.state
    if (error) return <Invalid />
    return (
      <EuiI18n token="editor" default="Editor">
        {(pageTitle) => (
          <Page preferences title={pageTitle}>
            <div>
              <EuiFlexGroup wrap gutterSize="xl">
                <EuiFlexItem>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <Player
                        audioTranscript={originalChapters}
                        trackId={id}
                        cursorTime={cursorTime}
                        getCurrentTime={this.getCurrentTime}
                        updateSeek={this.onTimeUpdate}
                        queryTerm={queryTerm}
                        isPlaying={false}
                        isContentAudio={isMediaAudio}
                        ref={this.playerRef}
                        searchBoxVisible
                        isTraining={false}
                        onPause={this.onPause}
                        token={token}
                      />
                      <EuiSpacer size="l" />
                      <EuiSpacer size="l" />

                      <Editor
                        originalChapters={originalChapters}
                        chapters={chapters}
                        currentTime={currentTime}
                        onCursorTimeChange={this.onCursorTimeChange}
                        onSelect={this.onSelectText}
                        updateTranscript={this.onUpdateTranscript}
                        isDiffVisible
                        schemaId={schemaId}
                        sectionHeaders={sectionHeaders}
                        initialCursor={initialCursor}
                      />
                      <EuiFlexGroup>
                        <EuiFlexItem grow={false}>
                          <EuiButtonEmpty onClick={this.cancel}>
                            <EuiI18n token="cancel" default="Cancel" />
                          </EuiButtonEmpty>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButton
                            style={{
                              border: 'solid 1px black',
                              borderRadius: '25px'
                            }}
                            onClick={this.save}
                          >
                            <EuiI18n
                              token="saveChanges"
                              default="Save Changes"
                            />
                          </EuiButton>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButton
                            style={{
                              background: 'rgb(9, 99, 255)',
                              color: 'white',
                              borderRadius: '25px'
                            }}
                            onClick={this.finalize}
                          >
                            <EuiI18n
                              token="sendToWebdoc"
                              default="Send to Co-worker"
                            />
                          </EuiButton>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>

                    <EuiFlexItem grow={false}>
                      <Info fields={fields} />
                      <EuiSpacer size="xxl" />
                      <Tags tags={tags} updateTags={this.onUpdateTags} />
                      <EuiSpacer size="xxl" />
                      <Schemas
                        schemas={schemas}
                        schemaId={schemaId}
                        onUpdate={this.updateSchemaId}
                      />

                      <EuiSpacer size="xxl" />
                      <Sidenote
                        content={sidenoteContent}
                        updateSidenote={this.updateSidenote}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          </Page>
        )}
      </EuiI18n>
    )
  }
}
