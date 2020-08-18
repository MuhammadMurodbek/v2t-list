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
import io from 'socket.io-client'
import Invalid from './Invalid'
import api from '../api'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags, { CODE_NAMESPACES } from '../components/Tags'
import Player from '../components/Player'
import Schemas from '../components/Schemas'
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
import * as recorder from '../utils/recorder'
import interpolateArray from '../models/interpolateArray'
import processChaptersLive from '../models/processChaptersLive'
import processTagsLive from '../models/processTagsLive'
import joinRecordedChapters from '../models/live/joinRecordedChapters'
import ListOfHeaders from '../components/ListOfHeaders'

const EMPTY_TRANSCRIPTIONS = [{ keyword: '', segments: [], values: [] }]
const VALID_TRANSCRIPT_STATES = ['TRANSCRIBED']

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    id: -1,
    preloadedTranscript: null,
    mic: false
  }

  audioContext = null

  state = {
    isTranscriptAvailable: true,
    originalChapters: null,
    currentTime: 0,
    cursorTime: 0,
    queryTerm: '',
    tags: {},
    chapters: [],
    fields: {},
    isMediaAudio: true,
    originalTags: {},
    schemas: [],
    schema: {},
    originalSchemaId: '',
    initialCursor: 0,
    allChapters: [],
    readOnlyHeaders: [],
    hiddenHeaderIds: [],
    defaultHeaderIds: [],
    recording: false,
    recordedTime: 0,
    recordedAudio: null,
    chaptersBeforeRecording: [],
    swapStatus: false
  }

  componentDidMount() {
    const { mic } = this.props
    document.title = 'Inovia AI :: V2t Editor 🎤'
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    this.checkTranscriptStateAndLoad()
    if (mic)
      this.setupSocketIO()
  }

  componentDidUpdate(prevProps) {
    const { id, mic } = this.props
    if (id !== prevProps.id) {
      this.checkTranscriptStateAndLoad()
    }
    if (mic && !prevProps.mic) {
      this.setupSocketIO()
    }
  }

  toggleRecord = () => {
    const { recording } = this.state
    if (recording) {
      this.stopRecording()
    } else {
      this.startRecording()
    }
  }

  startRecording = async () => {
    const { recordedTime } = this.state
    if (this.audioContext === null) this.audioContext = new window.AudioContext()
    await new Promise(resolve => this.setState({ recording: true }, resolve))
    this.socketio.emit('start-recording', {
      numChannels: 1,
      bps: 16,
      fps: parseInt(this.audioContext.sampleRate)
    })
    if (this.audioContext.state === 'suspended' && recordedTime !== 0) {
      this.audioContext.resume()
    } else {
      await this.connectAudioInput()
    }
    this.setState({ chaptersBeforeRecording: [
      ...JSON.parse(JSON.stringify(this.state.chapters))
    ] })
    recorder.start()
  }


  stopRecording = () => {
    return new Promise(resolve => {
      const { recordedTime } = this.state
      this.audioContext.suspend()
      this.socketio.emit('end-recording')
      return recorder.stop((recordedAudio) => {
        this.setState({ recordedAudio, recording: false }, resolve)
      }, recordedTime) // Use cursorTime to inser audio at cursor
    })
  }

  setupSocketIO = () => {
    const language = new URLSearchParams(this.props.location.search).get('language')
    const path = language ? `/${language}` : ''
    this.socketio = io.connect('wss://ilxgpu8000.inoviaai.se/audio', { transports: ['websocket'], path })
    this.socketio.on('add-transcript', (text) => {
      const { schema, chaptersBeforeRecording, cursorTime, tags, recordedTime } = this.state
      const sections = schema.fields.reduce((store, field) => {
        if (field.editable)
          store[field.id] = [field.name, ...(field.headerPatterns || [])]
        return store
      }, {})

      const restructuredChapter = processChaptersLive(text, sections, null, cursorTime)
      const diagnosString = restructuredChapter.map(chapter => chapter.segments.map(segment => segment.words).join(' ')).join(' ')
      processTagsLive(diagnosString, tags, this.onUpdateTags)
      const finalChapters = joinRecordedChapters(
        chaptersBeforeRecording,
        restructuredChapter,
        recordedTime
      )
      this.setState({ chapters: finalChapters })
    })
  }

  connectAudioInput = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recorder.init(stream)

    const inputPoint = this.audioContext.createGain()
    // Create an AudioNode from the stream.
    const realAudioInput = await this.audioContext.createMediaStreamSource(stream)
    let audioInput = realAudioInput
    audioInput = this.convertToMono(audioInput)
    audioInput.connect(inputPoint)

    const { createScriptProcessor, createJavaScriptNode } = this.audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode)
      .call(this.audioContext, 1024, 1, 1)

    realAudioInput.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    scriptNode.onaudioprocess = (audioEvent) => {
      const { recording } = this.state
      const recordedTime = Math.ceil(this.audioContext.currentTime)
      if (recordedTime !== this.state.recordedTime) {
        this.setState({ recordedTime })
      }
      if (recording === true) {
        let input = audioEvent.inputBuffer.getChannelData(0)
        input = interpolateArray(input, 16000, this.audioContext.sampleRate)
        console.log(`sample rate :: ${this.audioContext.sampleRate}`)
        // convert float audio data to 16-bit PCM
        var buffer = new ArrayBuffer(input.length * 2)
        var output = new DataView(buffer)
        for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]))
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        }
        this.socketio.emit('write-audio', buffer)
      }
    }
    inputPoint.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    const zeroGain = this.audioContext.createGain()
    zeroGain.gain.value = 0.0
    inputPoint.connect(zeroGain)
    zeroGain.connect(this.audioContext.destination)
  }

  convertToMono = (input) => {
    var splitter = this.audioContext.createChannelSplitter(2)
    var merger = this.audioContext.createChannelMerger(2)
    input.connect(splitter)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, 0, 1)
    return merger
  }

  checkTranscriptStateAndLoad = async () => {
    const { id, mic } = this.props
    let isTranscriptAvailable = true
    if (mic) return this.initiate() //if user can create the audio it doesn't need to exist yet
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
    const legacyTranscript = convertToV1API(transcript)
    this.onNewTranscript(legacyTranscript, schemas)
  }

  onNewTranscript = async (transcript, schemas) => {
    localStorage.setItem('transcriptId', this.props.id)
    const {
      fields,
      media_content_type,
      schemaId,
      transcriptions
    } = transcript

    const { data: originalSchema } = await api.getSchema(schemaId).catch(this.onError) || {}
    let schema = await this.extractHeaders(originalSchema)
    schema = this.extractTagsAndSchema(schema, transcriptions)

    this.setState({
      originalSchemaId: schemaId,
      allChapters: transcriptions,
      originalChapters: this.parseTranscriptions(transcriptions),
      fields: fields || {},
      isMediaAudio: (media_content_type || '').match(/^video/) === null,
      schemas,
      schema
    })
  }

  extractHeaders = (schema) => new Promise(resolve => {
    if (schema.fields) {
      const readOnlyHeaders = schema.fields.filter(f => f.visible && !f.editable)
      const hiddenHeaderIds = schema.fields.filter(f => !f.visible).map(({ id }) => id)
      const defaultHeaderIds = schema.fields.filter(f => f.default).map(({ id }) => id)
      schema.fields = schema.fields.filter(f => f.visible && f.editable)
      this.setState({
        readOnlyHeaders,
        hiddenHeaderIds,
        defaultHeaderIds
      }, resolve(schema))
    } else {
      this.setState({
        readOnlyHeaders: [],
        hiddenHeaderIds: [],
        defaultHeaderIds: []
      }, resolve(schema))
    }
  })

  extractTagsAndSchema = (schema, transcriptions) => {
    if (schema.fields) {
      const tagTypes = schema.fields.reduce((store, { id }) => {
        const tag = Object.entries(CODE_NAMESPACES).find(([type, namespace]) => namespace === id)
        if (tag) {
          store.push(tag[0])
        }
        return store
      }, [])

      schema.fields = schema.fields.filter(({ id }) => !Object.values(CODE_NAMESPACES).includes(id))

      const originalTags = tagTypes.reduce((store, tagType) => {
        const tagTranscript = transcriptions.find(({ keyword }) => keyword === CODE_NAMESPACES[tagType])
        if (tagTranscript && tagTranscript.values) {
          store[tagType] = tagTranscript.values
        } else {
          store[tagType] = []
        }
        return store
      }, {})

      this.setState({
        originalTags,
        tags: originalTags
      })
    }
    return schema
  }

  parseTranscriptions = (transcriptions) => {
    if (!transcriptions) return EMPTY_TRANSCRIPTIONS
    const { readOnlyHeaders, hiddenHeaderIds, defaultHeaderIds } = this.state
    const excludedKeywords = readOnlyHeaders.map(({id}) => id).concat(hiddenHeaderIds)

    const transcripts = transcriptions.map((transcript, id) => {
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
        id,
        ...transcript,
        keyword,
        segments
      }
    })
    return transcripts
      .filter(({ keyword }) => !Object.values(CODE_NAMESPACES).includes(keyword))
      .filter(({ keyword }) => !excludedKeywords.includes(keyword))
      .sort(({ keyword }) => {
        if(defaultHeaderIds.includes(keyword)) {
          return -1
        }
        return 0
      })
  }

  parseReadOnlyTranscripts = (transcriptions) => {
    const { readOnlyHeaders } = this.state
    if(!transcriptions) return []
    return readOnlyHeaders.map(field => {
      const chapter = transcriptions.find(({keyword}) => keyword === field.id)
        || { values: [], keyword: field.id }
      return { ...chapter, name: field.name }
    })
  }

  sectionHeaders = () => {
    const { schema, chapters } = this.state
    return schema.fields ? schema.fields.reduce((store, {id, name, editable}) => {
      const done = chapters.map(chapter => chapter.keyword).includes(id)
      if (editable)
        store.push({name, done})
      return store
    }, []) : []
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

  sendToReview = async () => {
    if (this.isLiveSessionStarted()) {
      const {id} = this.props
      await api.completeLiveTranscript(id)
      window.location = '/'
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

  mediaUpload = async() => {
    const { id } = this.props
    const { recordedAudio, schema } = this.state
    const file = await api.getBlobFile(recordedAudio)
    await api.uploadMediaLive(id, file, schema.id)
    await api.completeLiveTranscript(id)
  }

  save = async (shouldBeSentToCoworker = false) => {
    const { id, mic } = this.props
    const {
      allChapters,
      hiddenHeaderIds,
      readOnlyHeaders,
      originalChapters,
      tags,
      originalTags,
      schema,
      originalSchemaId,
      recording,
      recordedAudio,
      swapStatus
    } = this.state
    let { chapters } = this.state
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

    if (
      JSON.stringify(originalChapters) === JSON.stringify(chapters) 
      && JSON.stringify(tags) === JSON.stringify(originalTags) 
      && swapStatus === false 
      && originalSchemaId === schema.id
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

    // return back excluded (read only and hidden) transcripts
    const excludedKeywords = readOnlyHeaders.map(({id}) => id).concat(hiddenHeaderIds)
    chapters = chapters.concat(
      allChapters.filter(({ keyword }) => excludedKeywords.includes(keyword))
    )

    const { data: fullSchema } = await api.getSchema(schema.id).catch(this.onError) || {}
    const missingSections = fullSchema.fields.reduce((store, {id, name, required}) => {
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

    try {
      if (recording)
        await this.stopRecording()
      if (recording || recordedAudio) {
        await this.mediaUpload()
      }
      const fields = convertToV2API(schema, chapters, tags)
      await api.updateTranscription(id, schema.id, fields)
      this.setState(
        {
          allChapters: chapters,
          originalChapters: this.parseTranscriptions(chapters),
          originalTags: tags,
          swapStatus: false
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
      if (mic)
        window.location = '/' // this triggers medspeech to finish live dictation
    } catch(e) {
      console.error(e)
      addUnexpectedErrorToast(e)
    }
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  onUpdateSwapStatus = (swapStatus) => {
    this.setState({ swapStatus })
  }

  updateSchemaId = async (schemaId) => {
    const { allChapters } = this.state
    const { data: originalSchema } = await api.getSchema(schemaId).catch(this.onError) || {}
    let schema = await this.extractHeaders(originalSchema)
    schema = this.extractTagsAndSchema(schema, allChapters)
    this.setState({
      schema,
      originalChapters: this.parseTranscriptions(allChapters)
    })
    localStorage.setItem('lastUsedSchema', schema.id)
  }

  onCreateReadOnly = (keyword, e) => {
    const { value } = e.target
    if (!value) return
    const chapter = { keyword, segments: [], values: [{value}] }
    const allChapters = [...this.state.allChapters, chapter]
    this.setState({ allChapters })
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

  onError = (error) => {
    this.setState({ error })
  }

  render() {
    const { id, mic, token } = this.props
    const {
      currentTime,
      cursorTime,
      originalChapters,
      chapters,
      queryTerm,
      tags,
      isMediaAudio,
      schemas,
      schema,
      initialCursor,
      error,
      isTranscriptAvailable,
      allChapters,
      recording,
      recordedTime,
      recordedAudio
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
      <EuiI18n token={mic ? 'live' : 'editor'} default={mic ? 'Live Dictation' : 'Editor'}>
        {(pageTitle) => (
          <Page preferences title={pageTitle}>
            <EuiFlexGroup className="transcriptEdit" wrap>
              <EuiFlexItem grow={3}>
                <Player
                  audioTranscript={originalChapters}
                  audioClip={recordedAudio}
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
                  mic={mic}
                  recording={recording}
                  recordedTime={recordedTime}
                  toggleRecord={this.toggleRecord}
                />
                <EuiSpacer size="xl" />
                <Editor
                  originalChapters={originalChapters}
                  chapters={chapters}
                  currentTime={currentTime}
                  onCursorTimeChange={this.onCursorTimeChange}
                  onSelect={this.onSelectText}
                  updateTranscript={this.onUpdateTranscript}
                  schema={schema}
                  initialCursor={initialCursor}
                  noDiff={mic}
                />
              </EuiFlexItem>

              <EuiFlexItem grow={1}>
                <EuiFlexGroup direction="column" gutterSize="xl">
                  <EuiFlexItem grow={false}>
                    <ReadOnlyChapters
                      chapters={this.parseReadOnlyTranscripts(allChapters)}
                      onCreate={this.onCreateReadOnly}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <Tags tags={tags} updateTags={this.onUpdateTags} updateSwapStatus={this.onUpdateSwapStatus}/>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <Schemas
                      schemas={schemas}
                      schemaId={schema.id}
                      onUpdate={this.updateSchemaId}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} style={{position: 'sticky', top: 20}}>
                    {mic && <ListOfHeaders headers={this.sectionHeaders()} />}
                  </EuiFlexItem>
                </EuiFlexGroup>
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
                  isDisabled={mic}
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
