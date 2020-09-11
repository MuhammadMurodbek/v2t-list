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
  EuiI18n,
  EuiOverlayMask,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter
} from '@patronum/eui'
import io from 'socket.io-client'
import Invalid from './Invalid'
import api from '../api'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags, { TAG_NAMESPACES } from '../components/Tags'
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
import processTagsLive from '../models/processTagsLive'
import ListOfHeaders from '../components/ListOfHeaders'

const EMPTY_TRANSCRIPTIONS = [{ keyword: '', segments: [], values: [] }]
const VALID_TRANSCRIPT_STATES = ['TRANSCRIBED']

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    id: -1,
    preloadedTranscript: null,
    mic: false,
    redirectOnSave: false
  }

  audioContext = null
  ignoreMessagesTo = 0 // Avoid getting late replies, solve this better in mqtt
  offsetNextStop = 0 // Include keyword when merging audio

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
    timeStartRecording: 0,
    chaptersBeforeRecording: [],
    initialKeyword: null,
    tagRequestCache: {},
    modalMissingFields: []
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
    this.setState({
      chaptersBeforeRecording: [
        ...JSON.parse(JSON.stringify(this.state.chapters))
      ] })
    recorder.start()
  }

  stopRecording = () => {
    const offset = this.offsetNextStop
    this.offsetNextStop = 0
    return new Promise(resolve => {
      const { chapters, initialKeyword, timeStartRecording, currentTime, recordedTime } = this.state
      this.audioContext.suspend()
      this.socketio.emit('end-recording')
      const chapterIndex = chapters.findIndex(chapter => chapter.keyword === initialKeyword)
      const chapterId = chapterIndex > 0 ? chapterIndex : 0
      return recorder.stop((recordedAudio, appendedTime) => {
        const timeAdjustedChapters = chapters.map((chapter, i) => {
          if (i > chapterId)
            return { ...chapter, segments: chapter.segments.map(segment => ({
              ...segment,
              startTime: segment.startTime + appendedTime - offset,
              endTime: segment.endTime + appendedTime - offset
            })) }
          return chapter
        })
        this.setState({
          chapters: timeAdjustedChapters,
          recordedAudio,
          recording: false,
          timeStartRecording: this.getChapterEndTimeAdjusted(chapters.length -1),
          initialKeyword: chapters[chapters.length -1].keyword
        }, resolve)
      }, timeStartRecording, offset)
    })
  }

  updateRecordingChapter = async (keyword, offset) => {
    const { chapters } = this.state
    await this.stopRecording()
    this.offsetNextStop = offset
    const chapterId = chapters.findIndex(chapter => chapter.keyword === keyword)
    const timeStartRecording = this.getChapterEndTimeAdjusted(chapterId)
    this.setState({ timeStartRecording, initialKeyword: keyword }, this.startRecording)
  }

  setupSocketIO = () => {
    const language = new URLSearchParams(this.props.location.search).get('language')
    const path = language ? `/${language}` : ''
    this.socketio = io.connect('wss://ilxgpu8000.inoviaai.se/audio', { transports: ['websocket'], path })
    this.socketio.on('add-transcript', (text) => {
      const { recording, schema, chaptersBeforeRecording, tags, recordedTime, timeStartRecording, initialKeyword, tagRequestCache } = this.state
      if (!recording || Date.now() < this.ignoreMessagesTo) return // throw away changes that comes after stoped
      const sections = schema.fields.reduce((store, field) => {
        if (field.editable)
          store[field.id] = [field.name, ...(field.headerPatterns || [])]
        return store
      }, {})
      const keyword = initialKeyword || chaptersBeforeRecording[chaptersBeforeRecording.length -1].keyword
      const chapters = this.parseAudioResponse(JSON.parse(text), keyword, timeStartRecording)
      const diagnosString = JSON.parse(text).map(segment => segment.word).join(' ')
      if (!this.state.recording) return
      processTagsLive(diagnosString, tags, this.onUpdateTags, tagRequestCache, this.onUpdateTagRequestCache)
      if (!this.state.recording) return
      if (chapters)
        this.setState({ chapters, initialCursor: recordedTime })
      else
        this.setState({ initialCursor: recordedTime })
    })
  }

  parseAudioResponse = (chunks, keyword, initialTime) => {
    const { chaptersBeforeRecording } = this.state
    return [...chunks].reduce((store, chunk, i, arr) => {
      const currentKeyword = this.getKeyword(chunk.word)
      const existingNewKeyword = currentKeyword !== keyword && i === arr.length -1
        && chaptersBeforeRecording.some(chapter => chapter.keyword === currentKeyword)
      if (currentKeyword) {
        keyword = currentKeyword
      }
      if (existingNewKeyword) {
        this.ignoreMessagesTo = Date.now() + 1000
        const offset = chunk.start - chunks[chunks.length -1].end// - .2 // move slightly more
        this.updateRecordingChapter(keyword, offset)
        arr.slice(-1)
        return null
      }
      const startTime = chunk.start + initialTime
      const endTime = chunk.end + initialTime
      const segment = { words: `${chunk.word} `, startTime, endTime }
      const chapter = store.find(chapter => chapter.keyword === keyword)
        || { keyword, segments: [] }
      chapter.segments = [...chapter.segments, segment]
      return store.includes(chapter) ? store : [...store, chapter]
    }, JSON.parse(JSON.stringify(chaptersBeforeRecording)))
  }

  getKeyword = (text) => {
    const { schema } = this.state
    const comparable = text.toUpperCase()
    if (!schema) return
    const field = schema.fields.find(field => {
      const patterns = (field.headerPatterns || []).map(p => p.toUpperCase())
      return field.name.toUpperCase() === comparable || patterns.includes(comparable)
    })
    return field ? field.id : undefined
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
      if (!this.state.recording) return
      const recordedTime = this.audioContext.currentTime
      this.setState({ recordedTime })
      let input = audioEvent.inputBuffer.getChannelData(0)
      input = interpolateArray(input, 16000, this.audioContext.sampleRate)
      // console.log(`sample rate :: ${this.audioContext.sampleRate}`)
      // convert float audio data to 16-bit PCM
      var buffer = new ArrayBuffer(input.length * 2)
      var output = new DataView(buffer)
      for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]))
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      }
      this.socketio.emit('write-audio', buffer)
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

    const defaultField = originalSchema && originalSchema.fields.find(field => field.default)
    const defaultFields = [{ keyword: defaultField.name || '', segments: [], values: [] }]

    this.setState({
      originalSchemaId: schemaId,
      allChapters: transcriptions,
      originalChapters: this.parseTranscriptions(transcriptions),
      fields: fields || {},
      isMediaAudio: (media_content_type || '').match(/^video/) === null,
      schemas,
      schema
    }, () => {
      if (!this.state.originalChapters.length)
        this.setState({chapters: defaultFields})
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
      const namespaces = TAG_NAMESPACES.filter(namespace => schema.fields.some(({id}) => id === namespace))

      schema.fields = schema.fields.filter(({ id }) => !TAG_NAMESPACES.includes(id))

      const originalTags = namespaces.reduce((store, namespace) => {
        const tagTranscript = transcriptions.find(({ keyword }) => keyword === namespace)
        if (tagTranscript && tagTranscript.values) {
          store[namespace] = tagTranscript.values
        } else {
          store[namespace] = []
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
        : ''
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
      .filter(({ keyword }) => !TAG_NAMESPACES.includes(keyword))
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

  onCursorTimeChange = (cursorTime, chapterId, segmentId, timestampStart, timestampEnd) => {
    const { chapters } = this.state
    const initialKeyword = chapters[chapterId].keyword
    const timeStartRecording = this.getChapterEndTimeAdjusted(chapterId)
    this.setState({ cursorTime, initialKeyword, timeStartRecording, currentTime: cursorTime })
  }

  getChapterEndTimeAdjusted = (chapterId) => {
    const { recordedTime } = this.state
    const max = this.getChapterStartTime(chapterId + 1)
    if (max === null) return recordedTime
    const min = this.getChapterEndTime(chapterId)
    const silence = max - min
    return min + silence / 2
  }

  getChapterStartTime = (chapterId) => {
    const { chapters } = this.state
    while (chapterId < chapters.length) {
      const firstSegment = chapters[chapterId].segments[0]
      if (firstSegment)
        return firstSegment.startTime
      chapterId++
    }
    return null
  }

  getChapterEndTime = (chapterId) => {
    const { chapters } = this.state
    while (chapterId >= 0) {
      const segments = chapters[chapterId].segments
      const lastSegment = segments[segments.length -1]
      if (lastSegment)
        return lastSegment.endTime
      chapterId--
    }
    return 0
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
    await this.save(true)
    this.sendToCoworker()
  }

  sendToCoworker = async () => {
    const { id } = this.props
    const missingSections = await this.getMissingSections()
    if (missingSections.length) {
      addWarningToast(
        <EuiI18n
          token="unableToSaveDictation"
          default="Unable to send the dictation"
        />,
        <>
          <EuiI18n
            token="missingReuiredHeaders"
            default="Required field is missing"
          />:: <strong>{missingSections.join(', ')}</strong>
        </>
      )
      return
    }
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
  }

  save = async (force = false) => {
    const { id, mic, redirectOnSave } = this.props
    const {
      readOnlyHeaders,
      hiddenHeaderIds,
      allChapters,
      tags,
      schema,
      recording,
      recordedAudio
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

    const excludedKeywords = readOnlyHeaders.map(({id}) => id).concat(hiddenHeaderIds)
    chapters = chapters.concat(
      allChapters.filter(({ keyword }) => excludedKeywords.includes(keyword))
    )

    if (redirectOnSave && !force) {
      const needConfirmation = await this.askToRedirect()
      if (needConfirmation) return
    }

    try {
      if (recording)
        await this.stopRecording()
      if (recording || recordedAudio)
        await this.mediaUpload()
      if (mic)
        await api.completeLiveTranscript(id)

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
        }
      )
      if (redirectOnSave)
        window.location = '/'
    } catch(e) {
      console.error(e)
      addUnexpectedErrorToast(e)
    }
  }

  getMissingSections = async () => {
    const { readOnlyHeaders, hiddenHeaderIds, chapters, allChapters, schema } = this.state
    const excludedKeywords = readOnlyHeaders.map(({id}) => id).concat(hiddenHeaderIds)
    const concatinatedChapters = chapters.concat(
      allChapters.filter(({ keyword }) => excludedKeywords.includes(keyword))
    )

    const { data: fullSchema } = await api.getSchema(schema.id).catch(this.onError) || {}
    return fullSchema.fields.reduce((store, {id, name, required}) => {
      if (required && !concatinatedChapters.map(chapter => chapter.keyword).includes(id))
        store.push(name)
      return store
    }, [])
  }

  askToRedirect = async () => {
    const modalMissingFields = await this.getMissingSections()
    this.setState({ modalMissingFields })
    return modalMissingFields.length
  }

  onCloseMissingFieldsModal = (save) => {
    if (save)
      this.save(true)
    this.setState({ modalMissingFields: [] })
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  onUpdateTagRequestCache = (key, response) => {
    const tagRequestCache = { ...this.state.tagRequestCache, [key]: response }
    this.setState({ tagRequestCache })
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
    const { tags, tagRequestCache } = this.state
    const diagnosString = chapters.map(chapter => chapter.segments.map(segment => segment.words).join(' ')).join(' ')
    processTagsLive(diagnosString, tags, this.onUpdateTags, tagRequestCache, this.onUpdateTagRequestCache)
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
      recordedAudio,
      modalMissingFields
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
                    <Tags
                      tags={tags}
                      schemaId={schema.id}
                      updateTags={this.onUpdateTags}
                    />
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
                {/* id is used by Conscriptor */}
                <EuiButtonEmpty size="s" onClick={this.cancel} id='cancel_button'>
                  <EuiI18n token="cancel" default="Cancel" />
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                {/* id is used by Conscriptor */}
                <EuiButton
                  size="s"
                  onClick={() => this.save()}
                  id='save_changes'
                >
                  <EuiI18n
                    token="saveChanges"
                    default="Save Changes"
                  />
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                {/* id is used by Conscriptor */}
                <EuiButton
                  size="s"
                  fill
                  isDisabled={mic}
                  onClick={this.finalize}
                  id='send_to_coworker'
                >
                  <EuiI18n
                    token="sendToCoWorker"
                    default="Send to Co-worker"
                  />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
            <MissingFieldModal
              fields={modalMissingFields}
              onClose={this.onCloseMissingFieldsModal}
            />
          </Page>
        )}
      </EuiI18n>
    )
  }
}

const MissingFieldModal = ({ fields, onClose }) => {
  if (!fields.length) return null
  return (
    <EuiI18n
      tokens={["missingReuiredHeaders", "save", "cancel", "missingFieldMessage"]}
      defaults={["Required field is missing", "Save", "Cancel", "is missing. Do you want to save anyways?"]}
    >
      {([title, save, cancel, message]) =>
        <EuiOverlayMask>
          <EuiModal onClose={() => onClose(false)}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <p>{fields.join(', ')} {message}</p>
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty size="s" onClick={() => onClose(false)} id='popup_cancel_button'>
                {cancel}
              </EuiButtonEmpty>
              <EuiButton size="s" onClick={() => onClose(true)} id='popup_save_button'>
                {save}
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      }
    </EuiI18n>
  )
}
