// @ts-nocheck
/* eslint-disable no-console */
import React, { Component } from 'react'
import {
  EuiButtonEmpty,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiI18n
} from '@patronum/eui'
import api from '../api'
import Editor from '../components/Editor'
import Mic from '../components/Mic'
import LiveSchemaEngine from '../components/LiveSchemaEngine'
import interpolateArray from '../models/interpolateArray'
import convertToV2API from '../models/convertToV2API'
import joinRecordedChapters from '../models/live/joinRecordedChapters'
import PersonalInformation from '../components/PersonalInformation'
import io from 'socket.io-client'
import Page from '../components/Page'
import processChaptersLive from '../models/processChaptersLive'
import inoviaLogo from '../img/livediktering.png'
import * as recorder from '../utils/recorder'
import RecordList from '../components/RecordList'
import { addUnexpectedErrorToast } from '../components/GlobalToastList'
import getParameterByName from '../utils/url'
import { addWarningToast, addSuccessToast } from '../components/GlobalToastList'

const SCHEMA_ID = '1dfd8f4d-245d-4e6c-bc6e-cc343ca2d0c2'

export default class LiveDiktering extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  // eslint-disable-next-line max-len
  socketio = null

  state = {
    recording: false,
    listOfSchemas: [],
    recordedChapters: [],
    chapters: [{
      keyword: 'KONTAKTORSAK',
      segments: [
        { words: '', startTime: 0.0, endTime: 0.0 }
      ]
    }],
    originalText: '',
    currentText: '',
    currentTime: 0,
    sections: {
      'KONTAKTORSAK': [],
      'AT': [],
      'LUNGOR': [],
      'BUK': [],
      'DIAGNOS': []
    },
    seconds: 0,
    initialCursor: 0,
    recordedAudioClip: {},
    cursorTime: 0,
    chapterId: -9,
    segmentId: 0,
    defaultSectionHeaders: [
      { name: 'KONTAKTORSAK', done: true },
      { name: 'AT', done: false },
      { name: 'LUNGOR', done: false },
      { name: 'BUK', done: false },
      { name: 'BEDÖMNING & ÅTGÄRD', done: false },
      { name: 'DIAGNOS', done: false }
    ],
    defaultSchema: null,
    doktorsNamn: null,
    patientsNamn: null,
    patientsPersonnummer: null,
    departmentId: null,
    transcriptionId: null,
    schema: {}
  }

  componentDidMount = async () => {
    const transcriptionId = await api.createLiveSession()
    if (!transcriptionId) {
      addWarningToast(
        <EuiI18n
          token="unableToStartLiveTranscriptSession"
          default="Unable to start live trancript session."
        />,
        <EuiI18n
          token="checkNetworkConnectionOrContactSupport"
          default="Please check network connection, or contact support."
        />
      )
    } else {
      this.setState({ transcriptionId })
    }

    this.schemas()
    document.title = 'Inovia AI :: Live Diktering 🎤'
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {}
    }


    // Some browsers partially implement mediaDevices. We can't just assign an object with
    // getUserMedia as it would overwrite existing properties. Here, we will just add the
    // getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia
          = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise
            .reject(
              new Error('getUserMedia is not implemented in this browser')
            )
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })
      }
    }

    try {
      const { data: schema } = await api.getSchema(SCHEMA_ID)
      this.setState({ schema })
    } catch {
      addUnexpectedErrorToast()
    }
  }

  schemas = async () => {
    try {
      const schemaList = await api.getSchemas()
      this.setState({
        listOfSchemas: schemaList.data.schemas
      },
      () => {
        if (this.state.listOfSchemas) {
          this.localize()
        }
      })
    } catch(e) {
      addUnexpectedErrorToast(e)
    }
  }

  localize = () => {
    let language = getParameterByName('language')
    if (language === null) {
      language = 'sv'
    }
    if (language === 'no') {
      this.socketio = io.connect('wss://ilxgpu8000.inoviaai.se/audio', { path: '/norwegian', transports: ['websocket'] })
      this.setState({
        chapters: [{
          keyword: 'Pupiller:',
          segments: [
            { words: '', startTime: 0.0, endTime: 0.0 }
          ]
        }],
        sections: {
          'Pupiller:': [],
          'Blodtrykk:': [],
          'Stimulantia:': [],
          'Temperatur:': [],
          'Puls:': [],
          'Vurdering': [],
          'Cavum oris:': [],
          'Pulm:': [],
          'Abdomen:': [],
          'Underekstremiteter:': [],
          'Hud:': [],
          'Respirasjonsfrekvens': [],
          'Ører:': [],
          'Collum:': [],
          'Cor:': []
        },
        defaultSectionHeaders: [
          { name: 'Pupiller:', done: true },
          { name: 'Blodtrykk:', done: false },
          { name: 'Stimulantia:', done: false },
          { name: 'Temperatur:', done: false },
          { name: 'Puls:', done: false },
          { name: 'Vurdering', done: false },
          { name: 'Cavum oris:', done: false },
          { name: 'Pulm:', done: false },
          { name: 'Abdomen:', done: false },
          { name: 'Underekstremiteter:', done: false },
          { name: 'Hud:', done: false },
          { name: 'Respirasjonsfrekvens', done: false },
          { name: 'Ører:', done: false },
          { name: 'Collum:', done: false },
          { name: 'Cor:', done: false }
        ],
        defaultSchema:
        this.state.listOfSchemas
        && this.state.listOfSchemas.find(({ name }) => name === 'norwegian')
      })
    } else if (language === 'en') {
      // eslint-disable-next-line max-len
      this.socketio = io.connect('wss://ilxgpu8000.inoviaai.se/audio', { path: '/english', transports: ['websocket'] })

      this.setState({
        chapters: [{
          keyword: 'Examination',
          segments: [
            { words: '', startTime: 0.0, endTime: 0.0 }
          ]
        }],
        sections: {
          'Examination': [],
          'Clinical details': [],
          'Findings': [],
          'Comment': []
        },
        defaultSectionHeaders: [
          { name: 'Examination', done: true },
          { name: 'Clinical details', done: false },
          { name: 'Findings', done: false },
          { name: 'Comment', done: false }
        ],
        defaultSchema: this.state.listOfSchemas && this.state.listOfSchemas.find(({ name }) => name === 'English2')
      })
    } else {
      this.socketio = io.connect('wss://ilxgpu8000.inoviaai.se/audio', { transports: ['websocket'] })
      this.setState({
        defaultSchema: this.state.listOfSchemas && this.state.listOfSchemas.find(({ name }) => name === 'Allergi')
      })
    }


  }

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
  }

  getCurrentTime = () => {
    this.playerRef.current.updateTime()
  }

  onUpdateTranscript = (chapters) => {
    return new Promise((resolve) => this.setState({ chapters }, resolve))
  }

  convertToMono = (input) => {
    var splitter = this.audioContext.createChannelSplitter(2)
    var merger = this.audioContext.createChannelMerger(2)
    input.connect(splitter)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, 0, 1)
    return merger
  }

  onUpdatedSchema = (schema) => {
    this.setState({ schema })
  }

  updatedSections = (sections) => {
    this.setState({ sections })
  }

  gotStream = async (stream) => {
    const { recording } = this.state
    const inputPoint = this.audioContext.createGain()
    // Create an AudioNode from the stream.
    const realAudioInput = await this.audioContext.createMediaStreamSource(stream)
    let audioInput = realAudioInput
    audioInput = this.convertToMono(audioInput)
    audioInput.connect(inputPoint)

    const { createScriptProcessor, createJavaScriptNode } = this.audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode)
      .call(this.audioContext, 1024, 1, 1)

    const prevState = this
    realAudioInput.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    scriptNode.onaudioprocess = function (audioEvent) {
      const { seconds } = prevState.state
      if (seconds !== Math.ceil(prevState.audioContext.currentTime)) {
        prevState.setState({
          seconds: Math.ceil(prevState.audioContext.currentTime)
        })
      }

      if (recording === true) {
        let input = audioEvent.inputBuffer.getChannelData(0)
        input = interpolateArray(input, 16000, 44100)
        // convert float audio data to 16-bit PCM
        var buffer = new ArrayBuffer(input.length * 2)
        var output = new DataView(buffer)
        for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]))
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        }
        prevState.socketio.emit('write-audio', buffer)
      }
    }
    inputPoint.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    const zeroGain = this.audioContext.createGain()
    zeroGain.gain.value = 0.0
    inputPoint.connect(zeroGain)
    zeroGain.connect(this.audioContext.destination)
    this.socketio.on('add-transcript', function (text) {
      // add new recording to page
      prevState.setState({ currentText: text }, () => {
        const finalText = `${prevState.state.currentText}`
        const { sections, recordedChapters, cursorTime } = prevState.state
        const restructuredChapter =
          processChaptersLive(finalText, sections, Object.keys(sections)[0], cursorTime)
        const finalChapters =
          joinRecordedChapters(
            recordedChapters,
            restructuredChapter,
            0,
            prevState.state.chapterId,
            prevState.state.segmentId
          )
        prevState.setState({ chapters: finalChapters })
      })
    })
  }

  onCursorTimeChange = (cursorTime, chapterId, segmentId) => {
    this.setState({ cursorTime, chapterId, segmentId })
  }

  initAudio = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        recorder.init(stream)
        this.gotStream(stream)
      })
      .catch(function (err) {
        console.log(`${err.name} : ${err.message}`)
      })
  }


  addClipHandler = (clip) => {
    this.setState({
      recordedAudioClip: clip
    })
  }

  toggleRecord = () => {
    const { cursorTime, originalText, currentText } = this.state
    if (this.audioContext === null) this.audioContext = new this.AudioContext()
    const { recording, seconds } = this.state
    if (recording === true) {
      this.audioContext.suspend()
      this.socketio.emit('end-recording')
      recorder.stop(this.addClipHandler, cursorTime)

      this.setState({
        recording: false,
        originalText: `${originalText} ${currentText}`
      })
    } else {
      this.setState({ recording: true }, async () => {
        if (this.audioContext.state === 'suspended' && seconds !== 0) {
          this.socketio.emit('start-recording', {
            numChannels: 1,
            bps: 16,
            fps: parseInt(this.audioContext.sampleRate)
          })
          this.audioContext.resume()
        } else {
          await this.initAudio()
          this.socketio.emit('start-recording', {
            numChannels: 1,
            bps: 16,
            fps: parseInt(this.audioContext.sampleRate)
          })
        }
        await this.saveRecordedTranscript()
        recorder.start()
      })
    }
  }

  sendAsHorrribleTranscription = () => { }

  saveRecordedTranscript = async() => {
    const { chapters } = this.state
    const copiedChapter = [...JSON.parse(JSON.stringify(chapters))]
    this.setState({ recordedChapters: copiedChapter })
  }

  updateDoktorsNamn = (doktorsNamn) => { this.setState({doktorsNamn}) }

  updatePatientsNamn = (patientsNamn) => { this.setState({ patientsNamn }) }

  updatePatientsPersonnummer = (patientsPersonnummer) => { this.setState({ patientsPersonnummer}) }

  updateDepartmentId = (departmentId) => { this.setState({ departmentId}) }

  sparaDiktering = async() => {
    const {
      patientsNamn,
      patientsPersonnummer,
      doktorsNamn,
      transcriptionId,
      departmentId,
      chapters
    } = this.state
    const { data: schema } = await api.getSchema(SCHEMA_ID)
    const convertedTranscript = convertToV2API(schema, chapters)
    await this.mediaUpload()
    await api.updateTranscriptionV2(
      transcriptionId,
      doktorsNamn,
      patientsNamn,
      patientsPersonnummer,
      departmentId,
      convertedTranscript
    )

    addSuccessToast(
      <EuiI18n
        token="dictationUpdated"
        default="The dictation has been updated"
      />
    )
  }

  sendToReview = async () => {
    const {transcriptionId} = this.state
    await api.completeLiveTranscript(transcriptionId)
    window.location = '/'
  }

  sendToCoworker = async () => {
    const {transcriptionId} = this.state
    await api.completeLiveTranscript(transcriptionId)
    await api.approveTranscription(transcriptionId)
    window.location = '/'
  }

  mediaUpload = async() => {
    // Start uploading the transcript
    const {
      transcriptionId,
      recordedAudioClip,
      patientsNamn,
      patientsPersonnummer,
      doktorsNamn
    } = this.state
    const file = await api.getBlobFile(recordedAudioClip)
    const fields = [
      {
        id: 'doctor_full_name',
        values: [{
          value: doktorsNamn
        }]
      },
      {
        id: 'patient_full_name',
        values: [{
          value: patientsNamn
        }]
      },
      {
        id: 'patient_id',
        values: [{
          value: patientsPersonnummer
        }]
      }]

    api
      .uploadMediaLive(
        transcriptionId,
        file,
        SCHEMA_ID,
        fields
      )
      .catch((error) => {
        console.log(error)
        addUnexpectedErrorToast()
      })

  }

  render() {
    const {
      chapters,
      listOfSchemas,
      currentTime,
      seconds,
      initialCursor,
      recordedAudioClip,
      recording,
      schema
    } = this.state
    const usedSections = chapters.map(chapter => chapter.keyword)
    const defaultSchema = this.state.defaultSchema
    return (
      <EuiI18n token="live" default="Live Dictation">{ title => {
        // set translated document title
        document.title = `Inovia AI :: ${title}`
        return (
          <Page preferences logo={inoviaLogo} title={title}>
            <EuiFlexGroup wrap>
              <EuiFlexItem grow={3}>
                <EuiFlexGroup wrap>
                  <EuiFlexItem grow={false}>
                    <PersonalInformation
                      info={{
                        doktor: '',
                        patient: '',
                        personnummer: '',
                        departmentId: ''
                      }}
                      updateDoktorsNamn = {this.updateDoktorsNamn}
                      updatePatientsNamn={this.updatePatientsNamn}
                      updatePatientsPersonnummer = {this.updatePatientsPersonnummer}
                      updateDepartmentId={this.updateDepartmentId}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <Mic
                      microphoneBeingPressed={recording}
                      toggleRecord={this.toggleRecord}
                      seconds={seconds}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="l" />
                <Editor
                  transcript={chapters}
                  originalChapters={chapters}
                  chapters={chapters}
                  currentTime={currentTime}
                  onCursorTimeChange={this.onCursorTimeChange}
                  updateTranscript={this.onUpdateTranscript}
                  isDiffVisible
                  schema={schema}
                  initialCursor={initialCursor}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={1}>
                <LiveSchemaEngine
                  listOfSchemas={listOfSchemas}
                  usedSections={usedSections}
                  defaultSchema={defaultSchema && defaultSchema.id}
                  updatedSections={this.updatedSections}
                  onUpdatedSchema={this.onUpdatedSchema}
                  defaultSectionHeaders={this.state.defaultSectionHeaders}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup wrap justifyContent="flexStart">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="s"
                  onClick={() => { }}
                >
                  <EuiI18n token="cancel" default="Cancel" />
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  onClick={this.sparaDiktering}>
                  <EuiI18n
                    token="saveChanges"
                    default="Save Changes"
                  />
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  color="secondary"
                  fill
                  onClick={this.sendToReview}>
                  <EuiI18n
                    token="submitForReview"
                    default="Submit for review"
                  />
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  fill
                  onClick={this.sendToCoworker}>
                  <EuiI18n
                    token="sendToWebdoc"
                    default="Send to Webdoc"
                  />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                <RecordList audioClip={recordedAudioClip} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </Page>
        )
      }}
      </EuiI18n>
    )
  }
}
