/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
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
} from '@patronum/eui'
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
  addUnexpectedErrorToast,
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

const EMPTY_TRANSCRIPTION = { keyword: '', segments: [], values: []}
const VALID_TRANSCRIPT_STATES = ['TRANSCRIBED']

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
    singleSelectFieldOptions: {}
  }

  async componentDidMount() {
    const { mic } = this.props
    document.title = 'Inovia AI :: V2t Editor 🎤'
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    EventEmitter.subscribe(EVENTS.CANCEL, this.cancel)
    EventEmitter.subscribe(EVENTS.SEND, this.onSave)
    EventEmitter.subscribe(EVENTS.APPROVE_CHANGE, this.onApprovedChange)
    await this.checkTranscriptStateAndLoad()
    if (mic) this.initiateMQTT()
  }

  componentWillUnmount() {
    if (this.client) {
      this.client.unsubscribe(this.speechTopic)
      this.client.end()
    }
    EventEmitter.unsubscribe(EVENTS.CANCEL)
    EventEmitter.unsubscribe(EVENTS.SEND)
    EventEmitter.unsubscribe(EVENTS.APPROVE_CHANGE)
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

  toggleRecord = () => {
    const { recording, schema } = this.state
    if(schema.id) {
      if (recording) {
        this.stopRecording()
      } else {
        this.startRecording()
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

  stopRecording = (offsetEnd = 0) => {
    const offset = this.offsetAudioStop
    this.offsetAudioStop = 0
    return new Promise(async (resolve) => {
      const {
        chapters,
        chaptersBeforeRecording,
        initialKeyword,
        timeStartRecording
      } = this.state
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

          this.setState(
            {
              chapters: timeAdjustedChapters,
              recordedAudio,
              recording: false,
              timeStartRecording: this.getChapterEndTimeAdjusted(
                chapters.length - 1
              ),
              initialKeyword: chapters[chapters.length - 1].keyword
            },
            resolve
          )
        },
        timeStartRecording,
        offset,
        offsetEnd
      )
    })
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
      const isLastChapter = chapterId === chapters.length - 1
      const oldKeyword = keyword
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
      const segment = { words: `${chunk.word} `, startTime, endTime }
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
    if (!recording || Date.now() < this.ignoreMessagesTo) return
    // throw away changes that comes after stoped
    const chunks = JSON.parse(message.toString('utf-8')).map((json) => ({
      word: json.text,
      start: json.start / 1000,
      end: json.end / 1000
    }))
    const sections = schema.fields.reduce((store, field) => {
      if (field.editable)
        store[field.id] = [field.name, ...(field.headerPatterns || [])]
      return store
    }, {})
    const keyword =
      initialKeyword ||
      chaptersBeforeRecording[chaptersBeforeRecording.length - 1].keyword
    const chapters = this.parseAudioResponse(
      chunks,
      keyword,
      timeStartRecording
    )
    if (chapters) {
      this.setState({ chapters })
    }
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
    let isTranscriptAvailable = true
    if (mic) return await this.initiate()
    //if user can create the audio it doesn't need to exist yet
    try {
      const { data: transcriptState } = await api.transcriptState(id)
      if (
        transcriptState.id &&
        VALID_TRANSCRIPT_STATES.includes(transcriptState.state)
      ) {
        await this.initiate()
      } else {
        throw new ReferenceError()
      }
    } catch (e) {
      isTranscriptAvailable = false
    }
    this.setState({ isTranscriptAvailable })
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
      const { data: originalSchema } =
        (await api.getSchema(transcript.schemaId).catch(this.onError)) || {}
      const schema = await this.extractHeaders(originalSchema)
      this.setState({
        departments,
        departmentId: transcript.departmentId,
        schemas
      })
      const legacyTranscript = convertToV1API(transcript)
      
      // set complicated fields
      // complicatedFieldOptions
      await this.updateFieldsWithSelection(schema)
      this.onNewTranscript(legacyTranscript, schemas, schema)
    } catch (error) {
      this.onError(error)
    }
  }

  updateFieldsWithSelection = async (schema) => {
    console.log('schema', schema)
    const complicatedFields = {}
    const singleSelectFields = {}
    schema.fields
      .filter((f) => f.multiSelect)
      .forEach((f) => {
        complicatedFields[f.name] = f.choiceValues
      })
    schema.fields
      .filter((f) => !f.multiSelect)
      .filter((f) => f.choiceValues)
      .forEach((f) => {
        singleSelectFields[f.name] = f.choiceValues
      })
    console.log('schema', schema.name)
    console.log('complicatedFields', complicatedFields)
    console.log('singleSelectFields', singleSelectFields)
    this.setState({
      complicatedFieldOptions: complicatedFields,
      singleSelectFieldOptions: singleSelectFields
    })
  }

  onNewTranscript = async (transcript, schemas, selectedSchema) => {
    const { setTranscriptId } = this.context
    const { fields, media_content_type, schemaId, transcriptions } = transcript
    setTranscriptId(this.props.id)

    const { data: originalSchema } =
      (await api.getSchema(schemaId).catch(this.onError)) || {}
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
    console.log('parsedChapters', parsedChapters)
    console.log('updatedChapters', updatedChapters)
    
    this.setState(
      {
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
      },
      () => {
        if (!this.state.originalChapters.length)
          this.setState({ chapters: defaultFields })
      }
    )
  }

  processComplicatedFields = (schema, chapters) => {
    console.log('---------- .........-------')
    console.log('---------- .........-------')
    console.log('schema', schema)
    console.log('chapters', chapters)
    const complicatedFieldMap = {}
    schema.fields.forEach((schemaField) => {
      if (schemaField.choiceValues) {
        complicatedFieldMap[schemaField.name] = true
        // sometimes id is used as  keyword
        complicatedFieldMap[schemaField.id] = true
      } else {
        complicatedFieldMap[schemaField.name] = false
        complicatedFieldMap[schemaField.id] = false
      }
    })
    console.log('complicatedFieldMap', complicatedFieldMap)
    const stringToBeAttachedToTheNextChapter = []
    const updatedChapters = chapters.map((chapter, i) => {
      if (complicatedFieldMap[chapter.keyword]) {
        // Works only for singleselect

        const joinedSegments = chapter.segments
          .map((segment) => segment.words)
          .join(' ')
        const fieldWithOptions = schema.fields.filter(
          (field) =>
            field.name === chapter.keyword || field.id === chapter.keyword
        )
        const choices = []
        if (fieldWithOptions.length > 0) {
          if (fieldWithOptions[0].choiceValues) {
            fieldWithOptions[0].choiceValues.forEach((choice) => {
              choices.push(choice)
            })
          }
        }
        console.log('chapter', chapter)
        console.log('segments', joinedSegments)
        console.log('fieldWithOptions', fieldWithOptions)
        console.log('choices', choices)
        const ch = choices
          .map((choice) => {
            console.log('choice1', choice.toLowerCase())
            console.log('segments1', joinedSegments.toLowerCase())

            // search by segments one by one
            if (
              choice.toLowerCase().trim() ===
              joinedSegments.toLowerCase().trim()
            ) {
              return joinedSegments
            }
          }).filter(Boolean) // remove undefined values
        
        console.log('ch', ch)      
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
          console.log('currentFieldOfSchema', currentFieldOfSchema)
          if(currentFieldOfSchema.length){
            if(currentFieldOfSchema[0].multiSelect) { isSingleSelect = false }
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
    console.log('updatedChapters', updatedChapters)
    // add stringToBeAttachedToTheNextChapter
    stringToBeAttachedToTheNextChapter.forEach((appendedChapter, j) =>
      updatedChapters.splice(appendedChapter.index+1+j, 0, {
        keyword: '',
        segments: [{ words: appendedChapter.words, startTime: 0, endTime: 0 }]
      })
    )

    console.log('---------- .........-------')
    console.log('---------- .........-------')
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
      console.log('schema?', JSON.parse(JSON.stringify(schema)))
      const hasSelector = ({ id, choiceValues }) => TAG_NAMESPACES.includes(id)
      // || (choiceValues && choiceValues.length)
      const selectors = schema.fields.filter(hasSelector)
      console.log('selectors', selectors)
      schema.fields = schema.fields.filter((...args) => !hasSelector(...args))
      const originalTags = selectors.reduce(
        (store, { id: namespace, visible }) => {
          const tagTranscript = transcriptions.find(
            ({ keyword }) => keyword === namespace
          )
          if (tagTranscript && tagTranscript.values) {
            store[namespace] = {
              ...tagTranscript,
              visible
            }
          } else {
            store[namespace] = { values: [], visible }
          }
          return store
        },
        {}
      )
      console.log('extract', originalTags)

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
    const defaultKeyword = defaultField ? defaultField.name || '' : ''
    if (!transcriptions)
      return [{ ...EMPTY_TRANSCRIPTION, keyword: defaultKeyword }]
    const { readOnlyHeaders, hiddenHeaderIds, defaultHeaderIds } = this.state
    const excludedKeywords = readOnlyHeaders
      .map(({ id }) => id)
      .concat(hiddenHeaderIds)

    const transcripts = transcriptions.map((transcript, id) => {
      const keyword = transcript.keyword.length ? transcript.keyword : ''
      let segments = transcript.segments.map((chunk, i) => {
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
      const { id, name, choiceValues, multiSelect } = field
      const chapter = transcriptions.find(
        ({ keyword }) => keyword === field.id
      ) || { values: [], keyword: field.id }
      return { ...chapter, name: field.name, choiceValues, multiSelect  }
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
    this.setState({ currentTime })
  }

  onCursorTimeChange = (cursorTime, chapterId) => {
    const { chapters } = this.state
    const initialKeyword = chapters[chapterId].keyword
    const timeStartRecording = this.getChapterEndTimeAdjusted(chapterId)
    this.setState({
      cursorTime,
      initialKeyword,
      timeStartRecording,
      currentTime: cursorTime
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

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText }, () => {
      this.playerRef.current.searchKeyword()
    })
  }

  onSave = async () => {
    if (this.state.approved) this.finalize()
    else await this.save()
  }

  finalize = async () => {
    const canBeSaved = await this.save(true)
    if (canBeSaved) {
      this.sendToCoworker()
    }
  }

  sendToCoworker = async () => {
    const { id } = this.props
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
    } catch (e) {
      addUnexpectedErrorToast(e)
    }
  }

  mediaUpload = async () => {
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
      recordedAudio,
      noMappingFields,
      isUploadingMedia
    } = this.state
    if (isUploadingMedia) return
    this.setState({ isUploadingMedia: true })
    let { chapters } = this.state
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

    chapters.forEach((chapter) => {
      chapter.segments.forEach((segment) => {
        if (/\s$/.test(segment.words)) {
          segment.words = segment.words.slice(0, -1)
        }
      })
    })

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
      const fields = convertToV2API(unfiltredSchema, chapters, tags)

      const filtredFields = fields.filter(
        (field) => !~noMappingFields.findIndex(({ id }) => id === field.id)
      )

      filtredFields.push(...noMappingFields)

      await api.updateTranscription(id, unfiltredSchema.id, filtredFields)
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

      if (redirectOnSave) {
        window.location = '/'
      }
      return true
    } catch (e) {
      console.error(e)
      addUnexpectedErrorToast(e)
    } finally {
      this.setState({ isUploadingMedia: false })
    }
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

    const { data: fullSchema } = await api.getSchema(schema.id)
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

  updateSchemaId = async (schemaId) => {
    const { allChapters } = this.state
    const { data: originalSchema } =
      (await api.getSchema(schemaId).catch(this.onError)) || {}
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
    this.setState({
      schema: schemaWithMappings,
      originalChapters: parsedChapters,
      chapters: parsedChapters,
      noMappingFields,
      fieldsWithRequirement,
      transcriptions: filteredTranscriptions
    })
    localStorage.setItem('lastUsedSchema', schema.id)
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
          if (schemaField.choiceValues) {
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
        this.setState(
          {
            chapters: updatedChapters,
            schema: updatedSchema
          },
          resolve
        )
      } else {
        this.setState({ chapters }, resolve)
      }
    })
  }

  onPause = (playerCurrentTime) => {
    const { currentTime } = this.state
    const initialCursor = playerCurrentTime || currentTime
    this.setState({ initialCursor })
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
          console.log('outcome', outcome)
          addSuccessToast(
            <EuiI18n
              token="dictationRejected"
              default="The dictation has been rejected"
            />
          )
        }).catch((e)=>{
          console.log('error', e)
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
    console.log('-------------------------------------schema', schema)
    console.log(
      '--------------------------------------------------fields',
      fields
    )
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
                console.log('requiredField', requiredField)
                if(requiredField.length>0) {
                  if(requiredField[0].values) {
                    if(requiredField[0].values[0].value) {
                      console.log(
                        'current value in the transcript',
                        requiredField[0].values[0].value
                      )
                      console.log('required value/s', curr.requires)
                      if(curr.requires.oneOf) {
                        if(curr.requires.oneOf.length>0) {
                          console.log('oneof', curr.requires.oneOf)
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
    console.log('schemaWithMappings', schemaWithMappings)
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

  updateComplicatedFields = (updatedComplicatedFields, chapterId) => {
    console.log('updatedcombo', updatedComplicatedFields)
    console.log('chapterId', chapterId)
    // update chapters
    const { chapters } = this.state
    const updatedChapters = chapters.map((ch, i) => {
      if (chapterId !== i) {
        console.log('ch22', ch)
        return ch
      } else {
        let updatedSegments = []
        console.log('updatedcombo.length', updatedComplicatedFields.length)
        console.log('updatedcombo', updatedComplicatedFields.length)
        console.log(
          'updatedcombo22',
          updatedComplicatedFields
            .map((updatedComplicatedField) => updatedComplicatedField.label)
            .join(' ')
        )
        console.log('i', i)
        console.log('chapters', chapters)
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
          console.log('ch33', ch)
          return { ...ch, segments: updatedSegments }
        }
      }
    })
    console.log('updatedChapter', updatedChapters)
    this.onUpdateTranscript(updatedChapters, true)
      .then(this.refreshDiff)
  }

  // deleteComplicatedField = (chapterId) => {
  //   const { chapters } = this.state
  //   const updatedChapters =
  //     chapters.filter((chapter) => chapter.id !== chapterId)
  //   this.setState({ chapters: updatedChapters })
  // }

  // deleteComplicatedField = (chapterId) => {
  //   const { chapters } = this.state
  //   const updatedChapters = [...chapters]
  //   updatedChapters.splice(chapterId, 1)
  //   this.setState({ chapters: updatedChapters })
  // }

  deleteComplicatedField = (chapterId) => {
    const { chapters } = this.state
    const updatedChapters = [...chapters]
    updatedChapters.splice(chapterId, 1)
    this.setState({ chapters: updatedChapters })
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
      singleSelectFieldOptions
    } = this.state
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
                  onPause={this.onPause}
                  token={token}
                  mic={mic}
                  recording={recording}
                  recordedTime={recordedTime}
                  toggleRecord={this.toggleRecord}
                  isTraining={false}
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
                  recordingChapter={recording ? currentChapter : null}
                  noDiff={mic}
                  complicatedFieldOptions={complicatedFieldOptions}
                  singleSelectFieldOptions={singleSelectFieldOptions}
                  updateComplicatedFields={this.updateComplicatedFields}
                  deleteComplicatedField={this.deleteComplicatedField}
                />
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
                  <EuiFlexItem grow={false}>
                    <Schemas
                      location={this.props.location}
                      schemas={schemas}
                      schemaId={schema.id}
                      onUpdate={this.updateSchemaId}
                    />
                  </EuiFlexItem>
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
                        {field.choiceValues ? (
                          <EuiComboBox
                            isClearable={false}
                            options={field.choiceValues.map((label) => ({
                              label
                            }))}
                            selectedOptions={field.values.map(({ value }) => ({
                              label: value
                            }))}
                            singleSelection={
                              !field.multiSelect && { asPlainText: true }
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
                              console.log(value, schema) ||
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
                      <ListOfHeaders headers={this.sectionHeaders()} />
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiHorizontalRule />
            <EuiFlexGroup alignItems="baseline" justifyContent="flexEnd">
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
                            default="Approved, ready to send to Co-worker."
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
                      content={`${press} 'ctrl + s' ${toSave}`}
                    >
                      <EuiButton
                        size="s"
                        fill
                        isLoading={isUploadingMedia}
                        onClick={this.onSave}
                        id="save_changes"
                      >
                        <EuiI18n token="save" default="Save" />
                      </EuiButton>
                    </EuiToolTip>
                  )}
                </EuiI18n>
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
