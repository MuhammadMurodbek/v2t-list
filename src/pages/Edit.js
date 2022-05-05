/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
// @ts-nocheck
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
  EuiSwitch,
  EuiHorizontalRule,
  EuiI18n,
  EuiOverlayMask,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiFormRow,
  EuiTextArea,
  EuiToolTip,
  EuiComboBox
} from '@elastic/eui'
import { connect } from 'mqtt'
import jwtDecode from 'jwt-decode'
import Invalid from './Invalid'
import api from '../api'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags, { TAG_NAMESPACES } from '../components/Tags'
import Player from '../components/Player'
import Schemas from '../components/Schemas'
import Departments from '../components/Departments'
import convertToV1API from '../models/convertToV1API'
import convertToV2API from '../models/convertToV2API'
import {
  addErrorToast,
  addWarningToast,
  addSuccessToast
} from '../components/GlobalToastList'
import { EVENTS } from '../components/EventHandler'
import ReadOnlyChapters from '../components/ReadOnlyChapters'
import * as recorder from '../utils/recorder'
import reduceSegment from '../utils/reduceSegment'
import interpolateArray from '../models/interpolateArray'
import ListOfHeaders from '../components/ListOfHeaders'
import EventEmitter from '../models/events'
import J4Login from '../components/J4Login'
import _ from 'lodash'
import { renderTranscriptionState, sendMail } from '../utils'
import { interpret } from 'xstate'
import { timeMachine } from '../config/timeMachine'
import '../styles/simple-player.css'
import { v4 as uuidv4 } from 'uuid'
import Disease from '../components/medical-assistant/Disease'
import MedicalAssistantContext from '../context/MedicalAssistantContext'
import medicalAssistant from '../models/medicalAssistant'
import ICDParams from '../components/medical-assistant/ICDParams'
import AssistantResponse from '../components/medical-assistant/AssistantResponse'
import packageInformation from '../../package.json'

import { SchemaV2 } from '../api/index'

const EMPTY_TRANSCRIPTION = { keyword: '', segments: [], values: []}
const VALID_TRANSCRIPT_STATES = ['TRANSCRIBED', 'ERROR', 'REVOKED']

const INITIAL_STATE = {
  isTranscriptAvailable: true,
  originalChapters: [],
  currentTime: 0,
  cursorTime: 0,
  queryTerm: '',
  tags: {},
  chapters: [],
  fields: {},
  isMediaAudio: true,
  originalTags: {},
  schemas: [],
  departments: [],
  departmentId: '',
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
  currentChapter: null,
  tagRequestCache: {},
  modalMissingFields: [],
  approved: false,
  noMappingFields: [],
  fieldsWithRequirement: [],
  isUploadingMedia: false,
  complicatedFieldOptions: {},
  singleSelectFieldOptions: {},
  openJ4LoginModal: false,
  complicatedFieldMultiSelectOptions: {},
  highlightedContextForMedicalAssistant: [],
  isMedicalAssistantTriggered: false,
  shouldHighlightMedicalAssistant: false,
  assistanceData: [],
  metricsStartTime: 0,
  editSeconds: 0,
  outgoingChannel: {},
  isLiveDicModalOpen: true,
  isReadOnly: false,
  showTooltip: true
}

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    id: -1,
    preloadedTranscript: null,
    mic: false,
    redirectOnSave: false
  }

  client = null
  sessionId = 0
  mediaTopic = ''
  speechTopic = ''
  audioContext = null
  ignoreMessagesTo = 0 // Avoid getting late replies, solve this better in mqtt
  offsetAudioStop = 0 // Include keyword when merging audio

  state = INITIAL_STATE

  service = interpret(timeMachine).onTransition((current) => {
    const state =
      current.context.present[current.context.present.length - 1]
      // ! state is undefined on the first render
    const currentState = state ? state : INITIAL_STATE

    this.setState({ ...currentState })
  })

  async componentDidMount() {
    const { mic } = this.props
    this.service.start()
    document.title = 'Inovia AI :: V2t Editor 🎤'
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    EventEmitter.subscribe(EVENTS.CANCEL, this.cancel)
    EventEmitter.subscribe(EVENTS.SEND, this.onSave)
    EventEmitter.subscribe(EVENTS.APPROVE_CHANGE, this.onApprovedChange)
    EventEmitter.subscribe(EVENTS.SEND_EMAIL, this.sendEmailReport)
    await this.checkTranscriptStateAndLoad()
    if (mic) {
      const token = localStorage.getItem('token')
      const username = jwtDecode(token).sub
      this.client = connect(this.getMQTTUrl(), { username, password: token })
      this.client.on('connect', this.onMQTTConnect)
      const message = {
        sessionId: uuidv4(),
        audioBase64: ''
      }
      this.client.publish(`audio/${username}`, JSON.stringify(message))
      this.initiateMQTT()
    }
  }

  componentWillUnmount() {
    if (this.client) {
      this.client.unsubscribe(this.speechTopic)
      this.client.end()
    }
    EventEmitter.unsubscribe(EVENTS.CANCEL)
    EventEmitter.unsubscribe(EVENTS.SEND)
    EventEmitter.unsubscribe(EVENTS.APPROVE_CHANGE)
    EventEmitter.unsubscribe(EVENTS.SEND_EMAIL)
    this.service.stop()
  }

  async componentDidUpdate(prevProps) {
    const { id, mic } = this.props
    if (id !== prevProps.id) {
      await this.checkTranscriptStateAndLoad()
    }
    if (mic && !prevProps.mic) {
      this.initiateMQTT()
    }
  }

  toggleRecord = async () => {
    const { recording, schema } = this.state
    if(schema.id) {
      if (recording) {
        await this.stopRecording()
      } else {
        await this.startRecording()
      }
    } else {
      addWarningToast(
        <EuiI18n
          token="unableToStartLiveTranscriptSession"
          default="Unable to start live dictation"
        />,
        <>
          <EuiI18n
            token="schemaIsMissing"
            default="Schema is missing"
          />
        </>
      )
    }
  }

  startRecording = async () => {
    const { recordedTime } = this.state

    this.sessionId = Date.now()
    if (this.audioContext === null)
      this.audioContext = new window.AudioContext()
    await new Promise((resolve) => this.setState({ recording: true }, resolve))
    if (this.audioContext.state === 'suspended' && recordedTime !== 0) {
      this.audioContext.resume()
    } else {
      await this.connectAudioInput()
    }
    this.setState({
      chaptersBeforeRecording: [
        ...JSON.parse(JSON.stringify(this.state.chapters))
      ]
    })
    recorder.start()
  }

  stopRecording = async (offsetEnd = 0) => {
    const offset = this.offsetAudioStop
    this.offsetAudioStop = 0
    this.audioContext.suspend()
    this.setState(state => ({ ...state, recording: false }))

    const {
      chapters,
      chaptersBeforeRecording,
      initialKeyword,
      timeStartRecording
    } = this.state

    try {
      await this.audioContext.suspend()
      const chapterIndex = chapters.findIndex(
        (chapter) => chapter.keyword === initialKeyword
      )
      const chapterIdStart = chapterIndex > 0 ? chapterIndex : 0
      const chapterIdEnd =
        chapterIdStart + chapters.length - chaptersBeforeRecording.length
      return recorder.stop(
        (recordedAudio, appendedTime, appendedTimeCurrent) => {
          const timeAdjustedChapters = chapters.map((chapter, i) => {
            const fromSegmentId = chapters[chapterIdStart].segments.findIndex(
              ({ startTime }) => startTime >= timeStartRecording
            )
            if (
              i === chapterIdStart ||
              (i > chapterIdStart && i <= chapterIdEnd)
            )
              return {
                ...chapter,
                segments: chapter.segments.map((segment, i) => ({
                  ...segment,
                  startTime:
                    segment.startTime +
                    (i >= fromSegmentId ? appendedTimeCurrent : 0),
                  endTime:
                    segment.endTime +
                    (i >= fromSegmentId ? appendedTimeCurrent : 0)
                }))
              }
            if (i > chapterIdEnd)
              return {
                ...chapter,
                segments: chapter.segments.map((segment) => ({
                  ...segment,
                  startTime: segment.startTime + appendedTime,
                  endTime: segment.endTime + appendedTime
                }))
              }
            return chapter
          })
          
          this.setState(state => ({
            ...state,
            chapters: timeAdjustedChapters,
            recordedAudio,
            recording: false,
            isMedicalAssistantTriggered: false
          }))
        },
        timeStartRecording,
        offset,
        offsetEnd
      )
    } catch (error) {
      console.error(error)
    }
  }

  updateRecordingChapter = async (keyword, clipFrom, offset, chunk) => {
    await this.stopRecording(chunk.end - offset)
    this.offsetAudioStop = clipFrom
    const chapterId = this.state.chapters.findIndex(
      (chapter) => chapter.keyword === keyword
    )
    const timeStartRecording = this.getChapterEndTimeAdjusted(chapterId)
    const chapters = JSON.parse(JSON.stringify(this.state.chapters))
    const addition = offset - chunk.start
    chapters[chapterId].segments.push({
      words: `${chunk.word} `,
      startTime: timeStartRecording + addition,
      endTime: timeStartRecording + chunk.end - chunk.start + addition
    })
    this.setState(
      {
        chapters,
        timeStartRecording,
        initialKeyword: keyword
      },
      this.startRecording
    )
  }

  parseAudioResponse = (chunks, keyword, initialTime) => {
    const { chaptersBeforeRecording, chapters } = this.state
    let currentChapter = this.state.currentChapter
    const result = [...chunks].reduce((store, chunk, i, arr) => {
      const currentKeyword = this.getKeyword(chunk.word)
      const newKeyword =
        currentKeyword && currentKeyword !== keyword && i === arr.length - 1
      const existingNewKeyword =
        newKeyword &&
        chaptersBeforeRecording.some(
          (chapter) => chapter.keyword === currentKeyword
        )
      const chapterId = chapters.findIndex((c) => c.keyword === keyword)
      if (currentKeyword) {
        keyword = currentKeyword
      }
      const newChapterId = chapters.findIndex((c) => c.keyword === keyword)
      currentChapter =
        newChapterId >= 0 ? newChapterId : this.state.currentChapter
      if (existingNewKeyword) {
        this.ignoreMessagesTo = Date.now() + 1000
        const chapterEndTime =
          chunks.length > 2 ? chunks[chunks.length - 2].end : chunk.start
        const offset = chunk.start - (chunk.start - chapterEndTime) / 2
        const clipFrom =
          newChapterId < chapterId
            ? initialTime + offset
            : this.audioContext.currentTime
        this.updateRecordingChapter(keyword, clipFrom, offset, chunk)
        arr.slice(-1)
        return null
      }
      const startTime = chunk.start + initialTime
      const endTime = chunk.end + initialTime
      let wordFromChunk = ''
      if (chunk.word) {
        if (chunk.word === '\n') {
          wordFromChunk = '\n'
        } else {
          wordFromChunk = `${chunk.word} `
        }
      }
      const segment = { words: `${wordFromChunk}`, startTime, endTime }
      // const segment = { words: `${chunk.word} `, startTime, endTime }
      const chapter = store.find((chapter) => chapter.keyword === keyword) || {
        keyword,
        segments: []
      }
      chapter.segments = [...chapter.segments, segment]
      if (!store.includes(chapter)) {
        store.splice(chapterId + 1, 0, chapter)
      }
      return store
    }, JSON.parse(JSON.stringify(chaptersBeforeRecording)))
    this.setState({ currentChapter })
    return result
  }

  getLastKeyword = (chunks) => {
    const chunk = [...chunks]
      .reverse()
      .find(({ word }) => this.getKeyword(word))
    return chunk ? this.getKeyword(chunk.word) : null
  }

  getTranscriptInPlainText = (chapters) => {
    let chapterText = chapters
      .map((chapter) => chapter.segments.map((segment) => segment.words))
      .flat()
    chapterText = [...chapterText].join(' ')
    return chapterText
  }

  getKeyword = (text) => {
    const { schema } = this.state
    const keywordsFromSchema = []
    schema.fields.forEach((field) => {
      field.headerPatterns
        ? (keywordsFromSchema[field.name] = field.headerPatterns)
        : (keywordsFromSchema[field.name] = [])
    })

    const keyWordsAndSynonyms = schema.fields
      .map((field) => {
        return [field.name, field.headerPatterns]
      })
      .flat(Infinity)
      .filter((definedKeyword) => definedKeyword !== undefined)
      .map((kAndS) => kAndS.toUpperCase())
    const keywordLengths = keyWordsAndSynonyms.map(
      (keyWordsAndSynonym) => keyWordsAndSynonym.split(' ').length
    )
    const multiwordLength = Math.max(...keywordLengths)
    const { chapters } = this.state
    // Get the previous word and match with a keyword
    // Run this matching up to the longest number of words
    // if there is a match use the keyword and rearrange the whole transcript

    // Check for the single word match
    const comparable = text.toUpperCase()
    const plainText = this.getTranscriptInPlainText(chapters)
    if (!schema) return
    const field = schema.fields.find((field) => {
      const patterns = (field.headerPatterns || []).map((p) => p.toUpperCase())
      return (
        field.name.toUpperCase() === comparable || patterns.includes(comparable)
      )
    })

    if (field) {
      return field.id
    } else {
      // multi-word keyword
      const newComparableKeyword = ''
      // check if the word is a member of the list of words
      // keyWordsAndSynonyms makes a single string and split it to single words
      const SyllablesOfkeyWords = keyWordsAndSynonyms
        .join(' ')
        .split(' ')
        .map((syllable) => syllable.toUpperCase())
      if (SyllablesOfkeyWords.includes(text.toUpperCase())) {
        // search for the previous word
        // from the end of the plain text do the match
        const wordsOfTranscript = plainText.trim().split('  ')
        const previousWord = wordsOfTranscript
          .map((str, i) => {
            if (str === text) {
              // Apply logic for multiple words
              let matchedKeyword = str
              for (let k = 0; k < multiwordLength - 1; k += 1) {
                matchedKeyword = `${
                  wordsOfTranscript[i - 1 - k]
                } ${matchedKeyword}`
              }
              return matchedKeyword
            }
          })
          .filter((selectedKeyword) => selectedKeyword !== undefined)
        if (previousWord.length > 0) {
          const thePreviousWord = previousWord[0].trim()
          if (keyWordsAndSynonyms.includes(thePreviousWord.toUpperCase())) {
            // Check in the names
            const titles = Object.keys(keywordsFromSchema)
              .map((title) => title.toUpperCase())
              .filter(
                (foundHeader) => foundHeader === thePreviousWord.toUpperCase()
              )
            if (titles) {
              const field = schema.fields.find((field) => {
                return (
                  field.name.toUpperCase() === thePreviousWord.toUpperCase()
                )
              })

              // remove the keyword from the chapter as segment
              if (field) {
                if (field.id) {
                  return field.id
                }
              } else {
                return undefined
              }
            }
          }
        }
      }

      return undefined
    }
  }

  getCursorFromAudioInput = (keyword, chunks, chapters) => {
    const currentKeyword = this.getLastKeyword(chunks) || keyword
    const chapterIndex = chapters.findIndex(
      ({ keyword }) => keyword === currentKeyword
    )
    const chapterId = chapterIndex > 0 ? chapterIndex : 0
    return this.getChapterEndTime(chapterId)
  }

  initiateMQTT = () => {
    const token = localStorage.getItem('token')
    const username = jwtDecode(token).sub
    this.mediaTopic = `audio/${username}`
    this.speechTopic = `output/${username}`
    this.client = connect(this.getMQTTUrl(), { username, password: token })
    this.client.on('connect', this.onMQTTConnect)
    this.client.on('error', (error) => {
      throw error
    })
    this.client.on('message', this.onMQTTMessage)
  }

  getMQTTUrl = () => {
    const host = window.location.host
    if (host === 'localhost:8080')
      return 'wss://v2t-dev-mqtt.inoviagroup.se/mqtt'
    const hostArray = host.split('.')
    return `wss://${hostArray.shift()}-mqtt.${hostArray.join('.')}/mqtt`
  }

  onMQTTConnect = (packet) => {
    this.client.subscribe(this.speechTopic, { qos: 2 }, (error) => {
      if (error) throw error
    })
  }

  onMQTTMessage = (topic, message) => {
    const {
      recording,
      schema,
      chaptersBeforeRecording,
      tags,
      timeStartRecording,
      initialKeyword,
      tagRequestCache
    } = this.state
    const chunks = chaptersBeforeRecording.length===0 ? 
      [{ 'word': '', 'start': 0, 'end': 0 }] : 
      JSON.parse(message.toString('utf-8')).map((json) => ({
        word: json.text,
        start: json.start / 1000,
        end: json.end / 1000
      }))
    if (localStorage.getItem('continuousSupportStatus') === 'true') {
      this.rerunMedicalAssistant(true)
    }
    const sections = schema.fields.reduce((store, field) => {
      if (field.editable)
        store[field.id] = [field.name, ...(field.headerPatterns || [])]
      return store
    }, {})
    let keyword 
    if (chaptersBeforeRecording.length===0) {
      keyword = schema.fields.filter(field => field.default)[0].name
    } else {
      keyword =
        initialKeyword ||
        chaptersBeforeRecording[chaptersBeforeRecording.length - 1].keyword
    }
    
    const chapters = this.parseAudioResponse(
      chunks,
      keyword,
      timeStartRecording
    )
    
    const capitalizedChapters = chapters.map((chapter, chapterIndex)=>{
      const updatedSegments = []
      chapter.segments.forEach((seg, segmentIndex)=>{
        if (segmentIndex === 1 && chapterIndex !== 0) {
          const updatedWords =
            seg.words.charAt(0).toUpperCase() + seg.words.slice(1)
          updatedSegments.push({ ...seg, words: updatedWords })
        } else {
          updatedSegments.push(seg)
        }
      })
      return { ...chapter, segments: updatedSegments }
    })
    // console.log('capitalizedChapters', capitalizedChapters)
    if (chapters) {
      if (chapters.map(ch => ch.keyword.toLowerCase()).includes('bedömning')
      && this.state.isMedicalAssistantTriggered===false
      ) {
        this.setState({ isMedicalAssistantTriggered: true })
        localStorage.setItem('isMedicalAssistantActive', 'true')
        this.openMedicalAssistant(false)
      }
      this.setState({ chapters: capitalizedChapters })
    }
  }

  rerunMedicalAssistant = (isInteractive=false) => {
    this.openMedicalAssistant(isInteractive)
  }

  openMedicalAssistant = async (isInteractive=false) => {
    const { chapters } = this.state
    await this.checkParam(
      medicalAssistant.getTranscriptInPlainText(chapters), isInteractive)
  }

  checkParam = async (value, isInteractive=false) => {
    const { tags } = this.state
    const languageCode = localStorage.getItem('language')
    let language
    if (languageCode === '0')
    {language =  'swedish'}
    else if (languageCode === '2')
    {language = 'norwegian'}
    else if (languageCode === '3')
    {language = 'danish'}
    else if (languageCode === '1')
    {language='english'}
    else if (languageCode === '4')
    {language='spanish'}
    api
      .getMedicalAssistantData(value, language, isInteractive)
      .then((result) => {
        const parsedMedicalAssistantData = medicalAssistant
          .parseMedicalAssistantData(result.data, value, isInteractive)
        // console.log('parsedMedicalAssistantData', parsedMedicalAssistantData)
        const icd10Codes = parsedMedicalAssistantData.map(disease => {
          return disease.icdCodes.filter((icdCode) => icdCode.selectedStatus)
        }).flat()
        const additionalIcd10Codes = parsedMedicalAssistantData.map(disease => {
          return disease.additionalIcdCodes.filter((additionalIcdCode) => additionalIcdCode.selectedStatus)
        }).flat()
        const listOfCodes = [...icd10Codes, ...additionalIcd10Codes]
        // console.log('listOfCodes', listOfCodes)
        const finalTags = this.getICDTags(listOfCodes, tags)
        this.setState({
          assistanceData: parsedMedicalAssistantData,
          tags: finalTags
        })
      })
  }

  connectAudioInput = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recorder.init(stream)

    const inputPoint = this.audioContext.createGain()
    // Create an AudioNode from the stream.
    const realAudioInput = await this.audioContext.createMediaStreamSource(
      stream
    )
    let audioInput = realAudioInput
    audioInput = this.convertToMono(audioInput)
    audioInput.connect(inputPoint)

    const { createScriptProcessor, createJavaScriptNode } = this.audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode).call(
      this.audioContext,
      16384,
      1,
      1
    )

    scriptNode.onaudioprocess = (audioEvent) => {
      if (!this.state.recording) return
      const recordedTime = Math.ceil(this.audioContext.currentTime)
      this.setState({ recordedTime })
      const inputBuffer = audioEvent.inputBuffer.getChannelData(0)
      const input = interpolateArray(
        inputBuffer,
        16000,
        this.audioContext.sampleRate
      )
      const output = new DataView(new ArrayBuffer(input.length * 2))
      // length is in bytes (8-bit), so *2 to get 16-bit length
      for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]))
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      }
      recorder.record([input])

      const message = {
        sessionId: this.sessionId,
        audioBase64: Buffer.from(output.buffer).toString('base64')
      }
      this.client.publish(this.mediaTopic, JSON.stringify(message), { qos: 2 })
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
    const { outgoingChannel } = this.state
    let isTranscriptAvailable = true
    if (mic) return await this.initiate()
    //if user can create the audio it doesn't need to exist yet
    try {
      const { data: transcriptState } = await api.transcriptState(id)
      if (
        transcriptState.id &&
        VALID_TRANSCRIPT_STATES.includes(transcriptState.state)
      ) {
        if (transcriptState.state==='ERROR') {
          _.delay(renderTranscriptionState, 500, id)
        }
        if (transcriptState.state === 'ERROR' || transcriptState.state === 'REVOKED') {
          this.setState({ isReadOnly: true })
        }
        await this.initiate()
      } else {
        throw new ReferenceError()
      }

      if (_.has(transcriptState, ['exports'])) {
        const { exports } = transcriptState
        const _outgoingChannel = Array.isArray(exports) && exports.length ? exports[0] : outgoingChannel
        this.setState({ outgoingChannel: _outgoingChannel })
      }
    } catch (e) {
      isTranscriptAvailable = false
    }
    
    this.setState({ isTranscriptAvailable, metricsStartTime: new Date().getTime() })
  }

  initiate = async () => {
    const { id, defaultTranscript } = this.props
    if (defaultTranscript) await this.onNewTranscript(defaultTranscript)
    try {
      const { data: transcript } = await api.loadTranscription(id)
      const {
        data: { schemas }
      } = await api.getSchemas({
        departmentId: transcript.departmentId
      })
      const { data: { departments }} = await api.getDepartments()
      const originalSchema =
        (await SchemaV2.find(transcript.schemaId).catch(this.onError)) || {}
      const schema = await this.extractHeaders(originalSchema)
      this.setState({
        departments,
        departmentId: transcript.departmentId,
        schemas
      })
      this.updateMultiSelectOptionsOnLoad(transcript.fields)
      const legacyTranscript = convertToV1API(transcript)
      
      // set complicated fields
      // complicatedFieldOptions
      await this.updateFieldsWithSelection(schema)
      this.onNewTranscript(legacyTranscript, schemas, schema)
    } catch (error) {
      this.onError(error)
    }
  }

  updateMultiSelectOptionsOnLoad = (fields) => {
    const { complicatedFieldMultiSelectOptions } = this.state
    const updates = complicatedFieldMultiSelectOptions
    if(fields) {
      for (const field of fields) {
        field.namespace && TAG_NAMESPACES.push(field.namespace)
        if (!TAG_NAMESPACES.includes(field.namespace)
          && Object.prototype.hasOwnProperty.call(field, 'namespace')
          && Object.prototype.hasOwnProperty.call(field, 'values')) {
          updates[field.id] = field
        }
      }
    }
    this.setState({ complicatedFieldMultiSelectOptions: updates })
  }

  updateFieldsWithSelection = async (schema) => {
    const complicatedFields = {}
    const singleSelectFields = {}

    schema.fields.forEach((field) => {
      if (field.select) {
        const { multiple, options } = field.select
        if (multiple && !_.isUndefined(options)) {
          complicatedFields[field.name] = options
        } else if (!_.isUndefined(options)) {
          singleSelectFields[field.name] = options
        }
      }
    })

    this.setState({
      complicatedFieldOptions: complicatedFields,
      singleSelectFieldOptions: singleSelectFields
    })
  }

  onNewTranscript = async (transcript, schemas, selectedSchema) => {
    const { setTranscriptId } = this.context
    const { fields, media_content_type, schemaId, transcriptions } = transcript
    setTranscriptId(this.props.id)

    const originalSchema =
      (await SchemaV2.find(schemaId).catch(this.onError)) || {}
    const schema = this.extractTagsAndSchema(selectedSchema, transcriptions)
    const defaultField =
      originalSchema && originalSchema.fields.find((field) => field.default)
    if (!defaultField) {
      addErrorToast('Default field is missing in the schema')
    }
    const defaultFields = [
      { keyword: defaultField.name || '', segments: [], values: []}
    ]
    const {
      noMappingFields,
      schemaWithMappings,
      transcriptions: filteredTranscriptions,
      fieldsWithRequirement
    } = this.filterSchema(schema, [...transcriptions])
    const parsedChapters = this.parseTranscriptions(
      filteredTranscriptions,
      originalSchema
    )

    const updatedChapters = this.processComplicatedFields(
      schema,
      parsedChapters
    )
    const updatedState = {
      originalSchemaId: schemaId,
      allChapters: transcriptions,
      //originalChapters: parsedChapters,
      originalChapters: updatedChapters,
      //chapters: parsedChapters,
      chapters: updatedChapters,
      fields: fields || {},
      isMediaAudio: (media_content_type || '').match(/^video/) === null,
      schemas,
      schema: schemaWithMappings,
      noMappingFields,
      fieldsWithRequirement,
      transcriptions: filteredTranscriptions
    }
    this.service.send({
      type: 'UPDATE_TIME_MACHINE', data: { ...this.state, ...updatedState }
    })
    this.setState(state => ({
      ...state,
      ...updatedState
    }),
    () => {
      if (!this.state.originalChapters.length)
        this.setState({ chapters: defaultFields })
    }
    )
  }

  processComplicatedFields = (schema, chapters) => {
    // console.log('---------- .........-------')
    // console.log('---------- .........-------')
    // console.log('schema', schema)
    // console.log('chapters', chapters)
    const complicatedFieldMap = {}
    schema.fields.forEach((schemaField) => {
      if (schemaField.type?.select?.options) {
        complicatedFieldMap[schemaField.name] = true
        // sometimes id is used as  keyword
        complicatedFieldMap[schemaField.id] = true
      } else {
        complicatedFieldMap[schemaField.name] = false
        complicatedFieldMap[schemaField.id] = false
      }
    })
    // console.log('complicatedFieldMap', complicatedFieldMap)
    const stringToBeAttachedToTheNextChapter = []
    const updatedChapters = chapters.map((chapter, i) => {
      if (complicatedFieldMap[chapter.keyword]) {
        // Works only for singleselect

        const joinedSegments = chapter.segments
          .map((segment) => segment.words)
          .join('')
        const fieldWithOptions = schema.fields.filter(
          (field) =>
            field.name === chapter.keyword || field.id === chapter.keyword
        )
        const choices = []
        if (fieldWithOptions.length > 0) {
          if (fieldWithOptions[0].type?.select?.options) {
            fieldWithOptions[0].type?.select?.options.forEach((choice) => {
              choices.push(choice)
            })
          }
        }
        // console.log('chapter', chapter)
        // console.log('segments', joinedSegments)
        // console.log('fieldWithOptions', fieldWithOptions)
        // console.log('choices', choices)
        const ch = choices
          .map((choice) => {
            // console.log('choice1', choice.toLowerCase())
            // console.log('segments1', joinedSegments.toLowerCase())

            // search by segments one by one
            if (
              choice.toLowerCase().trim() ===
              joinedSegments.toLowerCase().trim()
            ) {
              return joinedSegments
            }
          }).filter(Boolean) // remove undefined values
        
        // console.log('ch', ch)      
        if(ch.length) { 
          return {
            ...chapter, 
            segments: [{ words: ch[0], startTime: 0, endTime: 0 }]
          }
        } else {
          //for single select
          // check if this field is singleselect
          let isSingleSelect = true
          const currentFieldOfSchema = schema
            .fields
            .filter(field=>
              field.name===chapter.keyword||field.id===chapter.keyword
            ).filter(Boolean)
          // console.log('currentFieldOfSchema', currentFieldOfSchema)
          if(currentFieldOfSchema.length){
            if(currentFieldOfSchema[0].type?.select?.multiple) { isSingleSelect = false }
          }
          if(isSingleSelect) {
            stringToBeAttachedToTheNextChapter.push({
              index: i,
              words: joinedSegments
            })
            return { keyword: chapter.keyword, segments: []}
          } else { 
            // Handle infectious and non-infectios error
            return chapter
          }
        }
      } else {
        return chapter
      }
    })
    // console.log('updatedChapters', updatedChapters)
    // add stringToBeAttachedToTheNextChapter
    stringToBeAttachedToTheNextChapter.forEach((appendedChapter, j) =>
      updatedChapters.splice(appendedChapter.index+1+j, 0, {
        keyword: '',
        segments: [{ words: appendedChapter.words, startTime: 0, endTime: 0 }]
      })
    )

    // console.log('---------- .........-------')
    // console.log('---------- .........-------')
    return updatedChapters
  }

  extractHeaders = (schema) =>
    new Promise((resolve) => {
      if (schema.fields) {
        const readOnlyHeaders = schema.fields.filter(
          (f) => f.visible && !f.editable
        )
        const hiddenHeaderIds = schema.fields
          .filter((f) => !f.visible)
          .map(({ id }) => id)
        const defaultHeaderIds = schema.fields
          .filter((f) => f.default)
          .map(({ id }) => id)
        schema.originalFields = schema.fields
        schema.fields = schema.fields.filter((f) => f.editable)
        this.setState(
          {
            readOnlyHeaders,
            hiddenHeaderIds,
            defaultHeaderIds
          },
          resolve(schema)
        )
      } else {
        this.setState(
          {
            readOnlyHeaders: [],
            hiddenHeaderIds: [],
            defaultHeaderIds: []
          },
          resolve(schema)
        )
      }
    })

  extractTagsAndSchema = (schema, transcriptions) => {
    if (schema.fields) {
      schema.fields.filter(
        (field) => field.type?.select?.dictionary
      ).map((field) => TAG_NAMESPACES.push(field.id))
      const hasSelector = ({ type }) => TAG_NAMESPACES.includes(type?.select?.dictionary)
      const selectors = schema.fields.filter(hasSelector)
      schema.fields = schema.fields.filter((...args) => !hasSelector(...args))
      const originalTags = selectors.reduce(
        (store, { id, name, visible, type }) => {
          const tagTranscript = transcriptions.find(
            ({ keyword }) => keyword === id
          )
          if (tagTranscript && tagTranscript.values) {
            store[name] = {
              ...tagTranscript,
              visible,
              dictionary: type?.select?.dictionary
            }
          } else {
            store[name] = {
              values: [],
              visible,
              dictionary: type?.select?.dictionary
            }
          }
          return store
        },
        {}
      )
      // console.log('extract', originalTags)

      this.setState({
        originalTags,
        tags: originalTags
      })
    }
    return schema
  }

  parseTranscriptions = (transcriptions, originalSchema) => {
    const defaultField =
      originalSchema && originalSchema.fields.find((field) => field.default)
    const defaultKeyword = defaultField ? defaultField.id || '' : ''
    if (!transcriptions)
      return [{ ...EMPTY_TRANSCRIPTION, keyword: defaultKeyword }]
    const { readOnlyHeaders, hiddenHeaderIds, defaultHeaderIds } = this.state
    const excludedKeywords = readOnlyHeaders
      .map(({ id }) => id)
      .concat(hiddenHeaderIds)

    const transcripts = transcriptions.map((transcript, id) => {
      const keyword = transcript.keyword.length ? transcript.keyword : ''
      let segments = transcript.segments.map((chunk, i) => {
        const isLast = i >= transcript.segments.length - 1
        const noSpaceSuffix = isLast || /^\s*$/.test(chunk.words)
        const words = noSpaceSuffix ? chunk.words : `${chunk.words} `
        return {
          ...chunk,
          words: words.replace(/ +$/, ' ')
        }
      })
      segments = segments.reduce(reduceSegment, [])
      return {
        id,
        ...transcript,
        keyword,
        segments
      }
    })
    const parsedTranscripts = transcripts
      .filter(({ keyword }) => !TAG_NAMESPACES.includes(keyword))
      .filter(({ keyword }) => !excludedKeywords.includes(keyword))
      .sort(({ keyword }) => {
        if (defaultHeaderIds.includes(keyword)) {
          return -1
        }
        return 0
      })
    return parsedTranscripts.length
      ? parsedTranscripts
      : [{ ...EMPTY_TRANSCRIPTION, keyword: defaultKeyword }]
  }

  parseReadOnlyTranscripts = (transcriptions) => {
    const { location } = this.props
    const { readOnlyHeaders } = this.state
    let search = location.search || window.location.search
    search = search.replaceAll(/&amp;/ig, '&')
    search = decodeURIComponent(search)

    const params = new URLSearchParams(search)

    if (!transcriptions) return []
    const chapters = readOnlyHeaders.map((field) => {
      const { name, select } = field
      const chapter = transcriptions.find(
        ({ keyword }) => keyword === field.id
      ) || { values: [], keyword: field.id }
      return { ...chapter, name, select }
    })

    let date
    let time
    let examination_time

    for (const [key, value] of params.entries()) {
      if (key === 'token' || key === 'template') continue
      if (key === 'date') {
        date = value
        continue
      }
      if (key === 'time') {
        time = value
        continue
      }

      const index = chapters.findIndex(({ keyword }) =>
        keyword.toLowerCase() === key.toLowerCase())
      if (index !== -1) {
        chapters[index] = { ...chapters[index], values: [{ value }]}
      }
    }

    if (date && time) {
      const regex = /[^:-\w\s]/gi
      const d = date.replace(regex, '')
      const t = time.replace(regex, '')
      examination_time = new Date(`${d} ${t}`).toISOString()

      const index = chapters.findIndex(({ keyword }) =>
        keyword === 'examination_time')
      if (index !== -1) {
        chapters[index] = {
          ...chapters[index],
          values: [{ value: examination_time }]
        }
      }
    }
    return chapters
  }


  sectionHeaders = () => {
    const { schema, chapters } = this.state
    return schema.fields
      ? schema.fields
        .filter(({ visible }) => visible)
        .reduce((store, { id, name, editable }) => {
          const includedChapter =
            chapters.find((chapter) => chapter.keyword === id) || false
          const done = includedChapter && includedChapter.segments.length > 0
          if (editable) store.push({ name, done })
          return store
        }, [])
      : []
  }

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime, shouldHighlightMedicalAssistant: false })
  }

  onCursorTimeChange = (cursorTime, chapterId) => {
    const { chapters } = this.state
    const initialKeyword = chapters[chapterId].keyword
    const timeStartRecording = this.getChapterEndTimeAdjusted(chapterId)
    this.setState({
      //cursorTime, // This will change cursor position if user drags seek
      initialKeyword,
      timeStartRecording
      // currentTime: cursorTime 
      // This will change cursor position if user drags seek
    })
  }

  getChapterEndTimeAdjusted = (chapterId) => {
    const max = this.getChapterStartTime(chapterId + 1)
    if (max === null)
      return this.audioContext
        ? this.audioContext.currentTime
        : this.getChapterEndTime(chapterId)
    const min = this.getChapterEndTime(chapterId)
    const silence = max - min
    return min + silence / 2
  }

  getChapterStartTime = (chapterId) => {
    const { chapters } = this.state
    while (chapterId < chapters.length) {
      const firstSegment = chapters[chapterId].segments[0]
      if (firstSegment) return firstSegment.startTime
      chapterId++
    }
    return null
  }

  getChapterEndTime = (chapterId) => {
    const { chapters } = this.state
    while (chapterId >= 0) {
      const segments = chapters[chapterId].segments
      const lastSegment = segments[segments.length - 1]
      if (lastSegment) return lastSegment.endTime
      chapterId--
    }
    return 0
  }

  getCurrentTime = () => {
    this.playerRef.current.updateTime()
  }

  getUpdatedValuesAndSegments = (chapters, diff, diseaseName, diseaseText, basedOnSymptom) => {
    const {
      currentTime,
      assistanceData,
      highlightedContextForMedicalAssistant
    } = this.state
    const highLigthedWordIndex = assistanceData.filter(disease=>disease.name===diseaseName)[0].foundAtIndex
    const isValueUpdated = false
    const isSegmentUpdated = false
    const updatedValues = []
    const updatedSegments = []
    const previousSegments = 0
    const highlightedChapterAndSegment = highlightedContextForMedicalAssistant.length>0
      ? highlightedContextForMedicalAssistant.slice(-1).pop(): []

    const newChapters = chapters.map((chapter, i)=>{
      const chapterInPlainText = medicalAssistant.getTranscriptInPlainText(chapters)
      const addedSelection = {
        ...chapter,
        segments: chapter.segments.map((segment, j)=>{
          const numberOfPreviousSegments = chapters.filter((chapter, k) => k < i).map(chapter => chapter.segments.length).reduce((a, b) => a + b, 0)
          if (i===highlightedChapterAndSegment.chapterId && j===highlightedChapterAndSegment.segmentId) { // works only for the first chapter

            let finalSegmentWord = ''
            const setOfSymbols = ['.', ';', ',']
            if (basedOnSymptom){
              if (setOfSymbols.includes(segment.words.trim().slice(-1))) {
                finalSegmentWord = `${diseaseText} ${diseaseName} ${diff}${segment.words.trim().slice(-1)} `
              } else {
                finalSegmentWord = `${diseaseText} ${diseaseName} ${diff} `
              }
            } else {
              if (setOfSymbols.includes(segment.words.trim().slice(-1))) {
                finalSegmentWord = `${diseaseText} ${diff}${segment.words.trim().slice(-1)} `
              } else {
                finalSegmentWord = `${diseaseText} ${diff} `
              }
            }

            return {
              ...segment,
              words: finalSegmentWord
            }
          } else {
            return segment
          }
        })
      }
      return addedSelection
    })


    // Set the values
    const chaptersWithUpdatedValues = newChapters.map((newChapter, i) => {
      const chapterString = newChapter.segments.map(segment => segment.words).join(' ')
      return {
        ...newChapter,
        values: [{ value: chapterString }]
      }
    })

    this.setState({ chapters: chaptersWithUpdatedValues }, () => {
    // API call to get new ICD-10 code
    // get full text
      const fullText = medicalAssistant.getTranscriptInPlainText(chaptersWithUpdatedValues)
      const languageCode = localStorage.getItem('language')
      let language
      if (languageCode === '0') { language = 'swedish' }
      else if (languageCode === '2') { language = 'norwegian' }
      else if (languageCode === '3') { language = 'danish' }
      else if (languageCode ==='1') { language = 'english'}
      else if (languageCode === '4') { language = 'spanish' }

      api
        .getMedicalAssistantData(fullText, language)
        .then((updatedAssistantData) => {
          const latestAssistanceData = updatedAssistantData.data.diseases
          const { assistanceData } = this.state
          let updatedICDCodes = []
          let updatedAdditionalCodes = []
          latestAssistanceData.forEach((latestData) => {
            if (latestData.name[0] === diseaseName) {
              updatedICDCodes = latestData.icdCodeMap
              updatedAdditionalCodes = latestData.additionalCodesMap
            }
          })
          const icdCodes = []
          const additionalIcdCodes = []
          Object.keys(updatedICDCodes).forEach((icdKey) => {
            icdCodes.push({
              value: icdKey,
              description: updatedICDCodes[icdKey],
              selectedStatus: false
            })
          })
          Object.keys(updatedAdditionalCodes).forEach((additionalKey) => {
            additionalIcdCodes.push({
              value: additionalKey,
              description: updatedAdditionalCodes[additionalKey],
              selectedStatus: false
            })
          })

          const assistanceDataWithJustICDTenCodeChange = assistanceData.map((aData) => {
            if (aData.name === diseaseName) {
              return { ...aData, icdCodes, additionalIcdCodes }
            } else {
              return aData
            }
          })
          this.setState({ assistanceData: assistanceDataWithJustICDTenCodeChange })
        })

    })

  }


  updateValue = (updatedValue) => {
    // console.log('updated value...............->', updatedValue)
    const { assistanceData, chapters, tags } = this.state
    if (updatedValue[0].disease) {
      const updatedAssistanceData = []
      assistanceData.forEach((disease) => {
        if (disease.name === updatedValue[0].disease) {
          updatedAssistanceData.push({
            ...disease,
            parameters: updatedValue.map(updatedParameters => updatedParameters.parameters)
          })
          const diff = medicalAssistant.getTheDiff(chapters, updatedValue)
          this.getUpdatedValuesAndSegments(chapters, diff, updatedValue[0].disease, updatedValue[0].nameFoundInContent, updatedValue[0].basedOnSymptom)
        } else {
          updatedAssistanceData.push(disease)
        }
      })
      this.setState({ assistanceData: updatedAssistanceData })
    } else {
      const icd10Codes = updatedValue.map(disease => {
        return disease.icdCodes.filter((icdCode) => icdCode.selectedStatus)
      }).flat()
      const additionalIcd10Codes = updatedValue.map(disease => {
        return disease.additionalIcdCodes.filter((additionalIcdCode) => additionalIcdCode.selectedStatus)
      }).flat()
      const listOfCodes = [...icd10Codes, ...additionalIcd10Codes]
      const finalTags = this.getICDTags(listOfCodes, tags)
      this.setState({ tags: finalTags })
      this.setState({ assistanceData: updatedValue })
    }
  }

  selectedDisease = (selectedSection) => {
    const { chapters, assistanceData } = this.state

    if(selectedSection!=='ICD-10')
    {
      this.setState({
        shouldHighlightMedicalAssistant: true,
        highlightedContextForMedicalAssistant: medicalAssistant
          .highlightSelectedDisease(selectedSection, chapters, assistanceData) })
    }
  }

  onKeyPressed = e => e.ctrlKey && e.keyCode === 75 ? this.openMedicalAssistant(false) : {} // ctrl+k

  getICDTags = (listOfCodes, tags) => {
    const newTags = listOfCodes.map((code) => {
      return { value: code.value, description: code.description }
    })
    const finalTags = { ...tags }
    if (Object.keys(this.state.tags).length > 0) {
      const diagnosKeyword = Object.keys(this.state.tags)[0]
      const existedTagsId = this.state.tags[diagnosKeyword].values.map(val => val.value)
      finalTags[diagnosKeyword] = {
        ...this.state.tags[diagnosKeyword],
        values: [
          ...this.state.tags[diagnosKeyword].values,
          ...newTags.filter(t => !existedTagsId.includes(t.value))]
      }
    }
    return finalTags
  }

  getExpandedObj = () => {
    const { chapters, assistanceData } = this.state
    
    const chapterInPlainText = medicalAssistant.getTranscriptInPlainText(chapters)
    const theLastSentence = chapterInPlainText.split('.').pop()
    const pattern = /diagnoskod|code|código/ig
    const obj = {}
    if(assistanceData.length){
      if (!assistanceData[0].isInteractive){
        obj['ICD-10'] = <ICDParams updateValue={this.updateValue} />
        return obj
      } 
      if (theLastSentence.match(pattern)) {
        obj['ICD-10'] = <ICDParams updateValue={this.updateValue} />
        return obj
      } else {
        obj[assistanceData[0].name] = (
          <Disease id={0} updateValue={this.updateValue} />
        )
        return obj
      }
    } 
    return obj
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText }, () => {
      this.playerRef.current.searchKeyword()
    })
  }

  onSave = async () => {
    if (this.state.approved) {
      this.finalize()
    } else {
      await this.save()
    }
  }

  finalize = async () => {
    const { redirectOnSave } = this.props
    const canBeSaved = await this.save(true)
    if (canBeSaved) {
      await this.sendToCoworker()
      if (redirectOnSave) {
        window.location = '/'
      }
    }
  }

  sendToCoworker = async () => {
    const { id } = this.props
    const { metricsStartTime } = this.state
    const metricsEndTime = new Date().getTime()

    const difference = metricsStartTime - metricsEndTime
    const editSeconds = Math.abs(difference / 1000)

    try {
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
            />{' '}
            <strong>{missingSections.join(', ')}</strong>
          </>
        )
        return
      }
      const { data: { exports }} = await api.transcriptState(id)
      
      if (Array.isArray(exports) && exports.length) {
        const requiresCredentials = exports[0].requiresCredentials || false
        if (requiresCredentials) {
          this.setState({ openJ4LoginModal: true, editSeconds })
          return
        }
      }

      await api.approveTranscription(id, {
        metrics: {
          editSeconds
        }
      })
      await renderTranscriptionState(id)

    } catch (e) {
      if (e instanceof Error) {
        const errorMessage = _.has(e, 'response.data.message') ? e.response.data.message : e.message
        addErrorToast(
          <EuiI18n token="error" default="Error" />,
          errorMessage
        )
      }
      console.error(e)
    }
  }


  mediaUpload = async () => {
    const { id } = this.props
    const { recordedAudio, schema } = this.state
    const file = await api.getBlobFile(recordedAudio)
    await api.uploadMediaLive(id, file, schema.id)
  }

  hasInvalidComplicatedField = () => {
    const { schema, chapters } = this.state
    const headers = chapters.map((chapter) => chapter.keyword)
    const invalidFields = []
    // Create an object with all the fields and options
    const complicatedFields = schema.fields
      .filter((field) => field.select?.options)
      // discarding multi select for now
      .filter((field) => !field.select?.multiple)
      .map(complicatedField=>{
        return {
          id: complicatedField.id,
          name: complicatedField.name,
          options: complicatedField.select.options
        }
      })
    complicatedFields.forEach((complicatedField)=>{
      if (headers.includes(complicatedField.name)) {
        const selectedComplicatedValues = chapters
          .filter(chapter => chapter.keyword === complicatedField.name)[0]
          .segments?.map(segment => segment.words)
        selectedComplicatedValues.map((selectedComplicatedValue) => {
          if (!complicatedField.options.includes(selectedComplicatedValue)) {
            invalidFields.push(complicatedField.name)
          }
        })
      } else if (headers.includes(complicatedField.id)){
        const selectedComplicatedValues = chapters
          .filter(chapter=>chapter.keyword===complicatedField.id)[0]
          .segments?.map(segment=>segment.words)
        // check if the value is valid
        selectedComplicatedValues.map((selectedComplicatedValue)=>{
          if (!complicatedField.options.includes(selectedComplicatedValue)) {
            invalidFields.push(complicatedField.name)
          }
        })
      }
    })
    return invalidFields.length>0 // has invalid complicated fields
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
      recordedAudio,
      noMappingFields,
      isUploadingMedia
    } = this.state
    if (isUploadingMedia) return
    this.setState({ isUploadingMedia: true })
    let chapters = [...this.state.chapters]
    const emptyChapters = chapters.filter(
      (chapter) => chapter.segments.length === 0
    )
    const requiredSections = schema.fields.filter((field) => field.required)
    const isThereAnyRequiredEmptySection = emptyChapters.some((chapter) => {
      return requiredSections.some((section) => section.id === chapter.keyword)
    })
    if (isThereAnyRequiredEmptySection) {
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
      this.setState({ isUploadingMedia: false })
      return false
    }

    const headers = chapters.map((chapter) => chapter.keyword)
    const uniqueHeaders = Array.from(new Set(headers))
    const hasEmptyHeader = headers.some((header) => !header)
    const invalid = headers.some(
      (header) => !schema.fields.find((field) => field.id === header)
    )
    if (hasEmptyHeader || headers.length !== uniqueHeaders.length || invalid) {
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
      this.setState({ isUploadingMedia: false })
      return false
    }

    if(this.hasInvalidComplicatedField()) {
      addWarningToast(
        <EuiI18n
          token="unableToSaveDictation"
          default="Unable to save the dictation"
        />,
        <EuiI18n
          token="invalidComplicatedFields"
          default="Complicated fields have invalid options"
        />
      )
      this.setState({ isUploadingMedia: false })
      return false
    }

    const map = chapters.reduce((store, chapter) => {
      if (!store.has(chapter.keyword)) {
        const segments = chapter.segments.map((segment) => {
          if (/\s$/.test(segment.words)) {
            return { ...segment, words: segment.words.slice(0, -1) }
          }
          return segment
        })
        store.set(chapter.keyword, { ...chapter, segments })
      }
      return store
    }, new Map())

    chapters = [...map.values()]

    const excludedKeywords = readOnlyHeaders
      .map(({ id }) => id)
      .concat(hiddenHeaderIds)
    chapters = chapters.concat(
      allChapters.filter(({ keyword }) => excludedKeywords.includes(keyword))
    )

    try {
      if (redirectOnSave && !force) {
        const needConfirmation = await this.askToRedirect()
        if (needConfirmation) return true
      }

      if (recording) await this.stopRecording()
      if (recording || recordedAudio) await this.mediaUpload()
      if (mic) await api.completeLiveTranscript(id)

      const unfiltredSchema = {
        ...schema,
        fields: [...schema.fields, ...noMappingFields]
      }
      const readOnlyChapters = this.parseReadOnlyTranscripts(chapters)
      readOnlyChapters.map(readOnlyChapter=>{
        const index = chapters.findIndex(
          (c) => c.keyword === readOnlyChapter.keyword
        )
        if (index > -1) {
          if (chapters[index].values) {chapters[index].segments = []
            chapters[index].values = readOnlyChapter.values}
        } else {
          if (readOnlyChapter.values) {
            chapters.push({
              keyword: readOnlyChapter.keyword,
              segments: [],
              values: readOnlyChapter.values
            })}
        }
      })

      let chapterBeforeSubmission = chapters
      // approving, remove the non-zero width joiner 
      // (journal system is not unicode)
      chapterBeforeSubmission = chapters.map((chapter) => {
        const updatedSegments = []
        chapter.segments.forEach((segment) => {
          let updatedWords
          if (segment.words) {
            updatedWords = segment.words.replaceAll('\u200c', '')
          } else {
            updatedWords=''
          }
          updatedSegments.push({ ...segment, words: updatedWords })
        })
        return { ...chapter, segments: updatedSegments }
      })
      const fields = convertToV2API(
        unfiltredSchema,
        chapterBeforeSubmission,
        tags
      )
      const filteredFields = fields.filter(
        (field) => !~noMappingFields.findIndex(({ id }) => id === field.id)
      )

      filteredFields.push(...noMappingFields)
      const updatedFieldsWithMultiSelectOptions =
        this.getComplicatedFieldsMultiSelectValues(filteredFields)

      await api.updateTranscription(
        id, unfiltredSchema.id, updatedFieldsWithMultiSelectOptions
      )
      const parsedChapters = this.parseTranscriptions(chapters)
      this.setState(
        {
          allChapters: chapters,
          originalChapters: parsedChapters,
          chapters: parsedChapters,
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

      if (redirectOnSave && !force) {
        window.location = '/'
      }
      return true
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.stack)
        addErrorToast(
          <EuiI18n token="error" default="Error" />,
          e.message
        )
      }
      console.error(e)
    } finally {
      this.setState({ isUploadingMedia: false })
    }
  }

  getComplicatedFieldsMultiSelectValues = (fields) => {
    const { complicatedFieldMultiSelectOptions } = this.state

    if (_.isEmpty(complicatedFieldMultiSelectOptions)) return fields

    return fields.map((field) => {
      if (complicatedFieldMultiSelectOptions[field.id]
          && Array.isArray(complicatedFieldMultiSelectOptions[field.id].values)
          && complicatedFieldMultiSelectOptions[field.id].values.length) {
        return complicatedFieldMultiSelectOptions[field.id]
      }
      return field
    })
  }

  getMissingSections = async () => {
    const { readOnlyHeaders, hiddenHeaderIds, chapters, allChapters, schema } =
      this.state
    const excludedKeywords = readOnlyHeaders
      .map(({ id }) => id)
      .concat(hiddenHeaderIds)
    const concatinatedChapters = chapters.concat(
      allChapters.filter(({ keyword }) => excludedKeywords.includes(keyword))
    )

    const fullSchema = await SchemaV2.find(schema.id)
    return fullSchema.fields.reduce((store, { id, name, required }) => {
      if (
        required &&
        !concatinatedChapters.map((chapter) => chapter.keyword).includes(id)
      )
        store.push(name)
      return store
    }, [])
  }

  askToRedirect = async () => {
    const modalMissingFields = await this.getMissingSections()
    this.setState({ modalMissingFields })
    return modalMissingFields.length
  }

  onCloseMissingFieldsModal = async (save) => {
    if (save) await this.save(true)
    this.setState({ modalMissingFields: []})
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  onUpdateTagRequestCache = (key, response) => {
    const tagRequestCache = { ...this.state.tagRequestCache, [key]: response }
    this.setState({ tagRequestCache })
  }

  updateDepartmentId = async (departmentId) => {
    this.setState({ departmentId })
    // Get the list of schema for the department
    const {
      data: { schemas }
    } = await api.getSchemas({ departmentId: departmentId })
    this.setState({ schemas })
    // Update selected schema
    this.updateSchemaId(schemas[0].id)
  }

  mergeArrays = async (allChapters, chapters) => {
    for(let i = 0, l = allChapters.length; i < l; i++) {
      for(let j = 0, ll = chapters.length; j < ll; j++) {
        if(allChapters[i].keyword === chapters[j].keyword) {
          allChapters.splice(i, 1, chapters[j])
          allChapters[i].segments.forEach(i => i.words = i.words.trim())
          delete allChapters[i].id
          break
        }
      }
    }
  }

  updateSchemaId = async (schemaId) => {
    const { allChapters, chapters } = this.state
    this.mergeArrays(allChapters, chapters)
    const originalSchema =
      (await SchemaV2.find(schemaId).catch(this.onError)) || {}
    if (!originalSchema) return
    let schema = await this.extractHeaders(originalSchema)
    schema = this.extractTagsAndSchema(schema, allChapters)
    await this.updateFieldsWithSelection(schema)
    const {
      noMappingFields,
      schemaWithMappings,
      fieldsWithRequirement,
      transcriptions: filteredTranscriptions
    } = this.filterSchema(schema, [...allChapters])
    const parsedChapters = this.parseTranscriptions(
      filteredTranscriptions,
      originalSchema
    )
    const updatedState = {
      schema: schemaWithMappings,
      originalChapters: parsedChapters,
      chapters: parsedChapters,
      noMappingFields,
      fieldsWithRequirement,
      transcriptions: filteredTranscriptions
    }
    this.setState(state => ({ ...state, ...updatedState }))
    this.service.send({
      type: 'UPDATE_TIME_MACHINE', data: { ...this.state, ...updatedState }
    })
    localStorage.setItem('lastUsedSchema', schema.id)
    if(!schemaWithMappings.fields.length) {
      addWarningToast(
        <EuiI18n token="warning" default="Warning" />,
        <EuiI18n
          token="schemaEmptyFields"
          default="{name} schema is not editable"
          values={{
            name: schemaWithMappings.name
          }}
        />
      )
    }
  }

  onCreateReadOnly = (keyword, e) => {
    const { value } = e.target
    if (!value) return
    const chapter = { keyword, segments: [], values: [{ value }]}
    const allChapters = [...this.state.allChapters, chapter]
    this.setState({ allChapters })
  }

  onUpdateReadOnly = (keyword, values) => {
    const { allChapters } = this.state
    var index = allChapters.findIndex((c) => c.keyword === keyword)
    if (index > -1) {
      allChapters[index].segments = []
      allChapters[index].values = values
    } else {
      allChapters.push({ keyword, segments: [], values })
    }
    this.setState({ allChapters })
  }

  onUpdateTranscript = (
    chapters,
    isKeyWordUpdated = false,
    chapterId = null
  ) => {
    return new Promise((resolve) => {
      if (isKeyWordUpdated) {
        const { fieldsWithRequirement, schema } = this.state
        const complicatedFieldMap = {}
        schema.fields.forEach((schemaField) => {
          if (schemaField.type?.select?.options) {
            complicatedFieldMap[schemaField.name] = true
            // sometimes id is used as  keyword
            complicatedFieldMap[schemaField.id] = true
          } else {
            complicatedFieldMap[schemaField.name] = false
            complicatedFieldMap[schemaField.id] = false
          }
        })
        // console.log('complicatedFieldMap', complicatedFieldMap)
        // Check if the current keyword has multiselect property
        const stringToBeAttachedToTheNextChapter = []
        const updatedChapters = chapters.map((chapter, i) => {
          if (complicatedFieldMap[chapter.keyword]) {
            // remove remaining segments to the next chapter
            // if the chapter id is the current id
            if(i===chapterId) {
              // no options are selected
              // send the extra value to the next chapter
              stringToBeAttachedToTheNextChapter.push(chapter.segments
                .map((segment) => segment.words)
                .join(' '))
              return { ...chapter, segments: []}
            } else {
              return chapter
            }
          } else {
            const keyword = chapter.keyword ?
              chapter.keyword.replace(/\s/g, '').toLowerCase() : ''
            const indexOfKeyword = chapter.segments.findIndex(({ words }) =>
              words.replace(/\r?\n|\r|\s/g, '').toLowerCase() === keyword
            )

            if (indexOfKeyword === 0) {
              chapter.segments = chapter.segments.slice(indexOfKeyword + 1)
            }
            return chapter
          }
        })

        stringToBeAttachedToTheNextChapter.forEach((appendedChapterWords) =>
          updatedChapters.push({
            keyword: '',
            segments: [
              { words: appendedChapterWords, startTime: 0, endTime: 0 }
            ]
          })
        )
        // Dependency calculation
        const keywordsFromTheChapters = updatedChapters.map(
          (chapter) => chapter.keyword
        )
        const schemaHeaderNames = schema.fields.map((field) => field.name)
        // Check if there is any field satisfy dependency
        const fieldsMetDependency = []
        // Check if there is any field does not satisfy dependency
        const fieldsUnmetDependency = []
        // newly elegible fields should be added here
        const addedFields = []

        fieldsWithRequirement.forEach((f) => {
          if (keywordsFromTheChapters.includes(f.requires.field)) {
            if (f.requires.oneOf) {
              if (f.requires.oneOf.length > 0) {
                let existingSegmentWords = updatedChapters
                  .filter((ch) => ch.keyword === f.requires.field)
                  .map((ch) => ch.segments.map((seg) => seg.words).join(' '))
                if (existingSegmentWords.length>0) {
                  existingSegmentWords = existingSegmentWords[0]
                }
                if (f.requires.oneOf.includes(existingSegmentWords)) {
                  fieldsMetDependency.push(f)
                } else {
                  fieldsUnmetDependency.push(f)
                }        
              } else {
                fieldsMetDependency.push(f)
              }
            } else {
              fieldsMetDependency.push(f)
            }
          } else {
            fieldsUnmetDependency.push(f)
          }
        })

        fieldsMetDependency.map((field) => {
          if (!schemaHeaderNames.includes(field.name)) {
            addedFields.push(field)
          }
        })

        let updatedSchema = addedFields.length
          ? {
            ...schema,
            fields: [...schema.fields, ...addedFields]
          }
          : schema
        const removedFieldNames = fieldsUnmetDependency.map(
          (field) => field.name
        )
        const fieldNamesAfterRemovalOfDependency = updatedSchema.fields.filter(
          (field) => !removedFieldNames.includes(field.name)
        )
        updatedSchema = fieldsUnmetDependency.length
          ? {
            ...schema,
            fields: fieldNamesAfterRemovalOfDependency
          }
          : updatedSchema
        this.setState({
          chapters: updatedChapters,
          schema: updatedSchema
        },
        resolve
        )
        this.service.send({
          type: 'UPDATE_TIME_MACHINE',
          data: {
            ...this.state,
            chapters: updatedChapters,
            schema: updatedSchema
          }
        })
      } else {
        console.log('allchapters -------', chapters)
        this.setState({ chapters }, resolve)
        this.service.send({
          type: 'UPDATE_TIME_MACHINE', data: { ...this.state, chapters }
        })
      }
    })
  }

  onApprovedChange = () => {
    this.setState({ approved: !this.state.approved })
  }

  cancel = () => {
    const { mic, id } = this.props
    if(mic) {
      api
        .rejectTranscription(id)
        .then((outcome)=>{
          // console.log('outcome', outcome)
          addSuccessToast(
            <EuiI18n
              token="dictationRejected"
              default="The dictation has been rejected"
            />
          )
        }).catch((e)=>{
          // console.log('error', e)
          addErrorToast(
            <EuiI18n token="error" default="Session persists" />
          )
        })
    }
    window.location = '/'
  }

  onError = (error) => {
    this.setState({ error })
  }

  filterSchema = (schema, fields) => {
    // console.log('-------------------------------------schema', schema)
    // console.log(
    //   '--------------------------------------------------fields',
    //   fields
    // )
    const noMappingFields = []
    const fieldsWithRequirement = []
    const mappingFields = schema.fields
      ? schema.fields.reduce((prev, curr) => {
        // if (curr.mappings) prev.push(curr)
        // Check if requirement condition is met
        if (curr.mappings) {
          // check the requirememt is met
          if (curr.requires) {
            if (curr.requires.field) {
              // Check if the field exists
              const fieldNames = fields.map((field) => field.keyword)
              if (fieldNames.includes(curr.requires.field)) {
                // Check if the specific value is present 
                const requiredField = fields.filter(
                  (f) => f.keyword === curr.requires.field
                )
                // console.log('requiredField', requiredField)
                if(requiredField.length>0) {
                  if(requiredField[0].values) {
                    if(requiredField[0].values[0].value) {
                      // console.log(
                      //   'current value in the transcript',
                      //   requiredField[0].values[0].value
                      // )
                      // console.log('required value/s', curr.requires)
                      if(curr.requires.oneOf) {
                        if(curr.requires.oneOf.length>0) {
                          // console.log('oneof', curr.requires.oneOf)
                          if (
                            requiredField[0].values[0].value.includes(
                              curr.requires.oneOf
                            )
                          ) {
                            prev.push(curr)
                          } else {
                            fieldsWithRequirement.push(curr)
                          }
                        } else {
                          prev.push(curr)
                        }
                      } else {
                        prev.push(curr)
                      }
                    }      
                  }
                }
              } else {
                fieldsWithRequirement.push(curr)
              }
            } else { 
              prev.push(curr)
            }
          } else {
            prev.push(curr)
          }
        } else if (!curr.mappings && curr.visible && curr.editable) {
          const foundField = fields.find((field, idx) => {
            if (field.keyword === curr.id) {
              fields.splice(idx, 1)
              return true
            } else {
              return false
            }
          })
          const values =
            foundField !== undefined
              ? foundField.values || [{ value: '' }]
              : [{ value: '' }]

          noMappingFields.push({
            ...curr,
            values
          })
        }
        return prev
      }, [])
      : []

    const schemaWithMappings = { ...schema, fields: mappingFields }
    // console.log('schemaWithMappings', schemaWithMappings)
    // console.log('fieldsWithRequirement', fieldsWithRequirement)
    return {
      schemaWithMappings,
      noMappingFields,
      transcriptions: fields,
      fieldsWithRequirement
    }
  }

  onNoMappingFieldValueChange = (value, id) => {
    const { noMappingFields } = JSON.parse(JSON.stringify(this.state))

    noMappingFields.forEach((field) => {
      if (field.id === id) {
        field.values[0].value = value
      }
    })

    this.setState({
      noMappingFields
    })
  }

  updateComplicatedFields = (
    updatedComplicatedFields, chapterId, isSingleSelectEnabled
  ) => {
    const { chapters, complicatedFieldMultiSelectOptions } = this.state
    if (!isSingleSelectEnabled) {
      const updates = complicatedFieldMultiSelectOptions
      const chapter = chapters[chapterId]
      if (chapter) {
        updates[chapter.keyword] = {
          id: chapter.keyword,
          namespace: chapter.keyword,
          values:
            updatedComplicatedFields.map(field => ({ value: field.label }))
        }
      }
    }
    const updatedChapters = chapters.map((ch, i) => {
      if (chapterId !== i) {
        // console.log('ch22', ch)
        return ch
      } else {
        let updatedSegments = []
        // console.log('updatedcombo.length', updatedComplicatedFields.length)
        // console.log('updatedcombo', updatedComplicatedFields.length)
        // console.log(
        //   'updatedcombo22',
        //   updatedComplicatedFields
        //     .map((updatedComplicatedField) => updatedComplicatedField.label)
        //     .join(' ')
        // )
        // console.log('i', i)
        // console.log('chapters', chapters)
        if (updatedComplicatedFields.length > 0) {
          if (ch.segments.length > 0) {
            // updatedSegments = ch.segments.map((segment) => {
            //   return {
            //     ...segment,
            //     words: updatedComplicatedFields
            //       .map(
            //         (updatedComplicatedField) =>
            // updatedComplicatedField.label
            //       )
            //       .join(' ')
            //   }
            // })
            updatedSegments = [
              {
                words: updatedComplicatedFields
                  .map(
                    (updatedComplicatedField) => updatedComplicatedField.label
                  )
                  .join(' '), 
                startTime: ch.segments[0].startTime, 
                endTime: ch.segments[ch.segments.length-1].endTime
              }
            ]
          } else {
            updatedSegments = [
              {
                words: updatedComplicatedFields
                  .map(
                    (updatedComplicatedField) => updatedComplicatedField.label
                  )
                  .join(' '),
                startTime: 0,
                endTime: 0
              }
            ]
          }
          return { ...ch, segments: updatedSegments }
        } else {
          let updatedSegments = []
          if (ch.segments) {
            updatedSegments = ch.segments.map((segment) => {
              return {
                ...segment,
                words: ''
              }
            })
          } else {
            updatedSegments = {
              words: '',
              startTime: 0,
              endTime: 0
            }
          }
          // console.log('ch33', ch)
          return { ...ch, segments: updatedSegments }
        }
      }
    })
    // console.log('updatedChapter', updatedChapters)
    this.onUpdateTranscript(updatedChapters, true)
      .then(this.refreshDiff)
  }

  deleteComplicatedField = (chapterId) => {
    const { chapters, complicatedFieldMultiSelectOptions } = this.state
    const updatedChapters = [...chapters]
    const updatedMultiSelectOptions = complicatedFieldMultiSelectOptions
    const keyword = chapters[chapterId]
      ? chapters[chapterId].keyword : undefined
    if (keyword && updatedMultiSelectOptions[keyword]) {
      delete updatedMultiSelectOptions[keyword]
    }
    updatedChapters.splice(chapterId, 1)
    this.setState({
      chapters: updatedChapters,
      complicatedFieldMultiSelectOptions: updatedMultiSelectOptions
    })
  }

  sendEmailReport = (subject) => {
    const { 
      props: { id: transcriptId }, 
      state: { departments, departmentId, schema: { id: schemaId, name: schemaName }}
    } = this

    if ([departmentId, schemaId, transcriptId].some(id => id == undefined)) {
      addErrorToast('Please wait until fully loaded')
      return
    }

    const departmentName = departments
      .find(department => department.id === departmentId).name||''
    const encoded = encodeURIComponent(
      `\n\n\n\n-----------------------------------------\
      \n-----------------------------------------\
      \nTranscription information:\
      \nDepartment: ${departmentName}\
      \nSchema: ${schemaName}\
      \nTranscript Id: ${transcriptId}\
      \nUI Version: ${packageInformation.version}\
      \n-----------------------------------------\
      \n-----------------------------------------`
    )
    sendMail(subject, encoded)
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
      departments,
      departmentId,
      initialCursor,
      currentChapter,
      error,
      isTranscriptAvailable,
      allChapters,
      recording,
      recordedTime,
      recordedAudio,
      modalMissingFields,
      approved,
      noMappingFields,
      isUploadingMedia,
      complicatedFieldOptions,
      singleSelectFieldOptions,
      openJ4LoginModal,
      highlightedContextForMedicalAssistant,
      shouldHighlightMedicalAssistant,
      editSeconds,
      isReadOnly,
      outgoingChannel
    } = this.state
    const { preferences } = this.context
    if (error) return <Invalid />
    if (!isTranscriptAvailable) {
      return (
        <Invalid
          title={
            <EuiI18n
              token="theTranscriptNotAvailable"
              default="The transcript is not available"
            />
          }
          message={
            <EuiI18n
              token="theTranscriptNotAvailableDescription"
              default="The transcript is already exported or not available"
            />
          }
        />
      )
    }

    return (
      <EuiI18n
        token={mic ? 'live' : 'editor'}
        default={mic ? 'Live Dictation' : 'Editor'}
      >
        {(pageTitle) => (
          <Page preferences title={pageTitle}>
            <EuiFlexGroup
              className="transcriptEdit"
              wrap
              onKeyDown={this.onKeyPressed}
              tabIndex="0">
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
                  token={token}
                  mic={mic}
                  recording={recording}
                  recordedTime={recordedTime}
                  toggleRecord={this.toggleRecord}
                  isTraining={false}
                />
                <EuiSpacer size="xl" />
                {!preferences.hideEditor && (
                  <Editor
                    originalChapters={originalChapters}
                    chapters={chapters}
                    currentTime={currentTime}
                    onCursorTimeChange={this.onCursorTimeChange}
                    onSelect={this.onSelectText}
                    updateTranscript={this.onUpdateTranscript}
                    schema={schema}
                    initialCursor={initialCursor}
                    recordingChapter={recording ? currentChapter : null}
                    noDiff={mic}
                    complicatedFieldOptions={complicatedFieldOptions}
                    singleSelectFieldOptions={singleSelectFieldOptions}
                    updateComplicatedFields={this.updateComplicatedFields}
                    deleteComplicatedField={this.deleteComplicatedField}
                    service={this.service}
                    highlightedContextForMedicalAssistant={
                      highlightedContextForMedicalAssistant
                    }
                    isMedicalAssistantEnabled={shouldHighlightMedicalAssistant}
                  />
                )}
              </EuiFlexItem>

              <EuiFlexItem grow={1}>
                <EuiFlexGroup direction="column" gutterSize="xl">
                  {mic && (
                    <EuiFlexItem grow={false}>
                      <Departments
                        departments={departments}
                        departmentId={departmentId}
                        onUpdate={this.updateDepartmentId}
                      />
                    </EuiFlexItem>
                  )}
                  <EuiFlexItem
                    grow={false}
                    style={{
                      display:
                        localStorage.getItem('isMedicalAssistantActive') ===
                        'true'
                          ? 'flex'
                          : 'none'
                    }}
                  >
                    <MedicalAssistantContext.Provider
                      value={this.state.assistanceData}
                    >
                      <AssistantResponse
                        data={this.state.assistanceData}
                        updateValue={this.updateValue}
                        selectedDisease={this.selectedDisease}
                        rerunMedicalAssistant={this.rerunMedicalAssistant}
                        expandedObj={this.getExpandedObj()}
                      />
                    </MedicalAssistantContext.Provider>
                  </EuiFlexItem>
                  {!mic && <EuiFlexItem grow={false}>
                    <Schemas
                      location={this.props.location}
                      schemas={schemas}
                      schemaId={schema.id}
                      onUpdate={this.updateSchemaId}
                    /></EuiFlexItem>
                  }
                  {mic && (
                    <EuiFlexItem
                      grow={false}
                      style={{ position: 'sticky', top: 5 }}
                    >
                      <ListOfHeaders
                        headers={this.sectionHeaders()}
                        schema={schema}
                      />
                    </EuiFlexItem>
                  )}                  
                  <EuiFlexItem grow={false}>
                    <ReadOnlyChapters
                      chapters={this.parseReadOnlyTranscripts(allChapters)}
                      onCreate={this.onCreateReadOnly}
                      onUpdate={this.onUpdateReadOnly}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <Tags
                      tags={tags}
                      schema={schema}
                      updateTags={this.onUpdateTags}
                    />
                  </EuiFlexItem>
                  {noMappingFields.map((field, key) => (
                    <EuiFlexItem grow={false} key={key}>
                      <EuiFormRow label={field.name}>
                        {(field.select && field.type?.select?.options) ? (
                          <EuiComboBox
                            isClearable={false}
                            options={field.type?.select?.options.map((label) => ({
                              label
                            }))}
                            selectedOptions={field.values.map(({ value }) => ({
                              label: value
                            }))}
                            singleSelection={
                              (field.select && !field.select.multiple) && { asPlainText: true }
                            }
                            onChange={(selectedOptions) => {
                              this.setState((prevState) => {
                                const noMappingFields = [
                                  ...prevState.noMappingFields
                                ]
                                const values = selectedOptions.map(
                                  ({ label }) => ({ value: label })
                                )
                                noMappingFields[key].values = values
                                return { ...prevState, noMappingFields }
                              })
                            }}
                          />
                        ) : (
                          <EuiTextArea
                            value={field.values[0].value}
                            onChange={({ target: { value }}) =>
                              // console.log(value, schema) 
                              this.onNoMappingFieldValueChange(value, field.id)
                            }
                          />
                        )}
                      </EuiFormRow>
                    </EuiFlexItem>
                  ))}
                  {mic && (
                    <EuiFlexItem
                      grow={false}
                      style={{ position: 'sticky', top: 20 }}
                    >
                      <ListOfHeaders
                        headers={this.sectionHeaders()}
                        schema={schema}
                      />
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiHorizontalRule />
            {!isReadOnly && (
              <EuiFlexGroup alignItems="baseline" justifyContent="flexEnd">
                <EuiFlexItem grow={true}>
                  <EuiI18n
                    tokens={['press', 'toSendEmailReport', 'emailSubject']}
                    defaults={['Press', 'to send email report', 'Transctiption details']}
                  >
                    {([press, toSendEmailReport, emailSubject]) => (
                      <EuiToolTip
                        position="top"
                        content={`${press} 'alt + shift + enter' ${toSendEmailReport}`}
                      >
                        <EuiButton
                          fill
                          size="s"
                          color="warning"
                          id="emailReport"
                          onClick={() => this.sendEmailReport(emailSubject)}
                        >
                          <EuiI18n token="emailReport" default="Send Email to the Service Desk" />
                        </EuiButton>
                      </EuiToolTip>
                    )}
                  </EuiI18n>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {/* id is used by Conscriptor */}
                  <EuiI18n tokens={['press']} defaults={['Press']}>
                    {([press]) => (
                      <EuiToolTip
                        position="top"
                        content={`${press} 'alt + shift + esc'`}
                      >
                        <EuiSwitch
                          label={
                            <EuiI18n
                              token="sendToCoWorker"
                              default="Approve and send"
                            />
                          }
                          checked={approved}
                          onChange={this.onApprovedChange}
                          // disabled={mic}
                          id="approved_checkbox"
                        />
                      </EuiToolTip>
                    )}
                  </EuiI18n>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {/* id is used by Conscriptor */}
                  <EuiI18n
                    tokens={['press', 'toCancel']}
                    defaults={['Press', 'to cancel editing']}
                  >
                    {([press, toCancel]) => (
                      <EuiToolTip
                        position="top"
                        content={`${press} 'alt + esc' ${toCancel}`}
                      >
                        <EuiButton
                          size="s"
                          color="text"
                          onClick={this.cancel}
                          id="cancel_button"
                        >
                          <EuiI18n token="cancel" default="Cancel" />
                        </EuiButton>
                      </EuiToolTip>
                    )}
                  </EuiI18n>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  {/* id is used by Conscriptor */}
                  <EuiI18n
                    tokens={['press', 'toSave']}
                    defaults={['Press', 'to save']}
                  >
                    {([press, toSave]) => (
                      <EuiToolTip
                        position="top"
                        content={this.state.showTooltip ? `${press} 'ctrl + s' ${toSave}` : ''}
                      >
                        <EuiButton
                          size="s"
                          fill
                          isLoading={isUploadingMedia}
                          onClick={this.onSave}
                          id="save_changes"
                          onMouseOver={() => this.setState({ showTooltip: true })}
                          onMouseOut={() => this.setState({ showTooltip: false })}
                        >
                          <EuiI18n token="save" default="Save" />
                        </EuiButton>
                      </EuiToolTip>
                    )}
                  </EuiI18n>
                </EuiFlexItem>
              </EuiFlexGroup>

            )}
            <MissingFieldModal
              fields={modalMissingFields}
              onClose={this.onCloseMissingFieldsModal}
            />
            <J4Login
              transcriptionId={this.props.id}
              editSeconds={editSeconds}
              onClose={() => this.setState({ openJ4LoginModal: false })}
              isOpen={openJ4LoginModal}
              outgoingChannel={outgoingChannel}
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
      tokens={[
        'missingReuiredHeaders',
        'save',
        'cancel',
        'missingFieldMessage'
      ]}
      defaults={[
        'Required field is missing',
        'Save',
        'Cancel',
        'is missing. Do you want to save anyways?'
      ]}
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
              <EuiButtonEmpty
                size="s"
                onClick={() => onClose(false)}
                id="popup_cancel_button"
              >
                {cancel}
              </EuiButtonEmpty>
              <EuiButton
                size="s"
                onClick={() => onClose(true)} id="popup_save_button"
              >
                {save}
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      }
    </EuiI18n>
  )
}
