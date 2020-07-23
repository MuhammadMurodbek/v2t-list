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
} from '@patronum/eui'
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
import convertToV1API from '../models/convertToV1API'
import convertToV2API from '../models/convertToV2API'
import {
  addUnexpectedErrorToast,
  addErrorToast,
  addGlobalToast,
  addWarningToast,
  addSuccessToast
} from '../components/GlobalToastList'
import ReadOnlyChapters from '../components/ReadOnlyChapters'

const EMPTY_TRANSCRIPTIONS = [{ keyword: '', segments: [], values: [] }]
const VALID_TRANSCRIPT_STATES = ['TRANSCRIBED']

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    id: -1,
    preloadedTranscript: null
  }

  state = {
    isTranscriptAvailable: true,
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
    schema: {},
    originalSchemaId: '',
    initialCursor: 0,
    allChapters: [],
    readOnlyHeaders: [],
    hiddenHeaderIds: [],
    defaultHeaderIds: [],
    patientInfo: {}
  }

  componentDidMount() {
    document.title = 'Inovia AI :: V2t Editor 🎤'
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    this.checkTranscriptStateAndLoad()
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props
    if (id !== prevProps.id) {
      this.checkTranscriptStateAndLoad()
    }
  }

  checkTranscriptStateAndLoad = async () => {
    const { id } = this.props
    let isTranscriptAvailable = true
    try {
      const { data: transcriptState } = await api.transcriptState(id)
      if (transcriptState.id && VALID_TRANSCRIPT_STATES.includes(transcriptState.state)) {
        this.initiate()
      } else {
        throw new ReferenceError()
      }
    } catch(e) {
      isTranscriptAvailable = false
    }
    this.setState({ isTranscriptAvailable })
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
    await this.extractPatientInformation(transcript.fields)
    const legacyTranscript = convertToV1API(transcript)
    this.onNewTranscript(legacyTranscript, schemas)
  }

  extractPatientInformation = async(fields) => {
    const patientFullName = fields.filter(field => field.id === 'patient_full_name')[0].values[0].value
    const patientId = fields.filter(field => field.id === 'patient_id')[0].values[0].value
    this.setState({patientInfo: {
      patient_full_name: patientFullName,
      patient_id: patientId
    }})
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
    await this.extractHeaders(schema)
    this.setState({
      originalSchemaId: schemaId,
      allChapters: transcriptions,
      originalChapters: this.parseTranscriptions(transcriptions),
      originalTags,
      tags: originalTags,
      fields: fields || {},
      isMediaAudio: (media_content_type || '').match(/^video/) === null,
      schemas,
      schema
    })
  }

  extractHeaders = (schema) => new Promise(resolve => {
    if (schema.fields) {
      const readOnlyHeaders = schema.fields.filter(f => !f.editable)
      const hiddenHeaderIds = schema.fields.filter(f => !f.visible).map(({ id }) => id)
      const defaultHeaderIds = schema.fields.filter(f => f.default).map(({ id }) => id)
      this.setState({
        readOnlyHeaders,
        hiddenHeaderIds,
        defaultHeaderIds
      }, resolve)   
    } else {
      this.setState({
        readOnlyHeaders: [],
        hiddenHeaderIds: [],
        defaultHeaderIds: []
      }, resolve)
    }
  })

  parseTranscriptions = (transcriptions) => {
    if (!transcriptions) return EMPTY_TRANSCRIPTIONS
    const { readOnlyHeaders, hiddenHeaderIds, defaultHeaderIds } = this.state
    const excludedKeywords = readOnlyHeaders.map(({id}) => id).concat(hiddenHeaderIds)

    const transcripts = transcriptions.map((transcript) => {
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
    return transcripts
      .filter(transcript => !excludedKeywords.includes(transcript.keyword))
      .sort(transcript => {
        if(defaultHeaderIds.includes(transcript.keyword)) {
          return -1
        }
        return 0
      })
  }

  parseReadOnlyTranscripts = (transcriptions) => {
    if(!transcriptions) return []
    // filter read only transcripts by id, and add name field from the schema to display
    const { readOnlyHeaders, hiddenHeaderIds, defaultHeaderIds } = this.state
    return transcriptions.reduce((store, transcript) => {
      if(!hiddenHeaderIds.includes(transcript.keyword)) {
        const readOnlyHeader = readOnlyHeaders.find(({id}) => id === transcript.keyword)
        if(readOnlyHeader) {
          store.push({
            ...transcript,
            name: readOnlyHeader.name
          })
        }
      }
      return store
    }, [])
      .sort(transcript => {
        if(defaultHeaderIds.includes(transcript.keyword)) {
          return -1
        }
        return 0
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
      schema,
      originalSchemaId
    } = this.state
    if (
      JSON.stringify(originalChapters) === JSON.stringify(chapters) &&
      JSON.stringify(tags) === JSON.stringify(originalTags) &&
      originalSchemaId === schema.id
    ) {
      this.sendToCoworker()
    } else {
      this.save(true)
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
    } catch(e) {
      addUnexpectedErrorToast(e)
    }
  }

  save = async (shouldBeSentToCoworker = false) => {
    const { id } = this.props
    const {
      originalChapters,
      chapters,
      tags,
      originalTags,
      schema,
      originalSchemaId
    } = this.state

    const isThereAnyEmptySection = chapters.find(chapter => chapter.segments.length === 0) || false
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

    const missingSections = schema.fields.reduce((store, {id, name, required}) => {
      if (required && !chapters.map(chapter => chapter.keyword).includes(id))
        store.push(name)
      return store
    }, [])

    if (missingSections.length) {
      addWarningToast(
        <EuiI18n
          token="unableToSaveDictation"
          default="Unable to save the dictation"
        />,
        <>
          <EuiI18n
            token="missingReuiredHeaders"
            default="Required keyword is missing"
          />:: <strong>{missingSections.join(', ')}</strong>
        </>
      )
      return
    }

    if (
      JSON.stringify(originalChapters) === JSON.stringify(chapters) &&
      JSON.stringify(tags) === JSON.stringify(originalTags) &&
      originalSchemaId === schema.id
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
      const fields = convertToV2API(schema, chapters, tags)
      await api.updateTranscription(id, schema.id, fields)
      this.setState(
        {
          allChapters: chapters,
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
    } catch(e) {
      addUnexpectedErrorToast(e)
    }
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  updateSchemaId = async (schemaId) => {
    const { allChapters } = this.state
    const { data: schema } = await api.getSchema(schemaId).catch(this.onError) || {}
    await this.extractHeaders(schema)
    this.setState({
      schema,
      originalChapters: this.parseTranscriptions(allChapters)
    })
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

  updateSidenote = () => { }

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
      patientInfo,
      schemas,
      schema,
      initialCursor,
      sidenoteContent,
      error,
      isTranscriptAvailable,
      allChapters
    } = this.state
    if (error) return <Invalid />
    if (!isTranscriptAvailable) {
      return (
        <Invalid
          title={(
            <EuiI18n
              token="theTranscriptNotAvailable"
              default="The transcript is not available"
            />
          )}
          message={(
            <EuiI18n
              token="theTranscriptNotAvailableDescription"
              default="The transcript is already exported or not available"
            />
          )}
        />
      )
    }
    return (
      <EuiI18n token="editor" default="Editor">
        {(pageTitle) => (
          <Page preferences title={pageTitle}>
            <EuiFlexGroup className="transcriptEdit" wrap>
              <EuiFlexItem grow={3}>
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
                  schema={schema}
                  initialCursor={initialCursor}
                />
              </EuiFlexItem>

              <EuiFlexItem grow={1}>
                <ReadOnlyChapters chapters={this.parseReadOnlyTranscripts(allChapters)} />
                <EuiSpacer size="xxl" />
                <Info fields={patientInfo} />
                <EuiSpacer size="xxl" />
                <Tags tags={tags} updateTags={this.onUpdateTags} />
                <EuiSpacer size="xxl" />
                <Schemas
                  schemas={schemas}
                  schemaId={schema.id}
                  onUpdate={this.updateSchemaId}
                />
                <EuiSpacer size="xxl" />
                <Sidenote
                  content={sidenoteContent}
                  updateSidenote={this.updateSidenote}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup alignItems="baseline">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="s" onClick={this.cancel}>
                  <EuiI18n token="cancel" default="Cancel" />
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
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
                  size="s"
                  fill
                  onClick={this.finalize}
                >
                  <EuiI18n
                    token="sendToCoWorker"
                    default="Send to Co-worker"
                  />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </Page>
        )}
      </EuiI18n>
    )
  }
}
