// @ts-nocheck
/* eslint-disable no-console */
import React, { Component } from 'react'
import { EuiButtonEmpty, EuiSpacer, EuiFlexGroup, EuiFlexItem, EuiButton } from '@elastic/eui'
import api from '../api'
import Editor from '../components/Editor'
import Mic from '../components/Mic'
import LiveTemplateEngine from '../components/LiveTemplateEngine'
import interpolateArray from '../models/interpolateArray'
// import joinRecordedChapters from '../models/live/joinRecordedChapters'
import PersonalInformation from '../components/PersonalInformation'
import Tags from '../components/Tags'
import io from 'socket.io-client'
import Page from '../components/Page'
import processChapters from '../models/processChapters'
import inoviaLogo from '../img/livediktering.png'
import * as recorder from '../utils/recorder'
// import RecordList from '../components/RecordList'
import { addUnexpectedErrorToast } from '../components/GlobalToastList'

export default class LiveDiktering extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  // eslint-disable-next-line max-len
  socketio = io.connect('wss://ilxgpu8000.inoviaai.se/audio', { path: '/english', transports: ['websocket'] })
  state = {
    alreadyRecorded: false,
    recording: false,
    recordingAction: 'Starta',
    microphoneBeingPressed: false,
    listOfTemplates: [],
    recordedChapters: [],
    chapters: [{
      keyword: 'Examination',
      segments: [
        { words: '. ', startTime: 0.0, endTime: 0.0 },
        { words: '. ', startTime: 0.0, endTime: 0.0 },
        { words: '. ', startTime: 0.0, endTime: 0.0 }
      ]
    }],
    originalText: '',
    currentText: '',
    currentTime: 0,
    queryTerm: '',
    sections: {
      'KONTAKTORSAK': [],
      'AT': [],
      'LUNGOR': [],
      'BUK': [],
      'DIAGNOS': []
    },
    isMicrophoneStarted: false,
    tags: [],
    seconds: 0,
    duration: 0.0,
    previousDuration: 0.0,
    previousCurrentTime: new Date(),
    initialRecordTime: null,
    headerUpdatedChapters: null,
    initialCursor: 0,
    sectionHeaders: [],
    recordedAudioClip: {},
    cursorTime: 0,
    chapterId: -9,
    segmentId: 0
  }

  componentDidMount = () => {
    this.templates()
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
  }

  templates = async () => {
    try {
      const templateList = await api.getSectionTemplates()
      this.setState({ listOfTemplates: templateList.data.templates })
    } catch {
      addUnexpectedErrorToast()
    }
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText })
  }

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
  }

  getCurrentTime = () => {
    this.playerRef.current.updateTime()
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
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
      if (text.includes('stop recording') || text.includes('Stop recording')) {
        prevState.setState(
          { recording: false, microphoneBeingPressed: false },
          () => {
            prevState.socketio.emit('end-recording')
            prevState.socketio.close()
          }
        )
      } else {
        // add new recording to page
        const { originalText } = prevState.state
        prevState.setState({ currentText: text }, () => {
          const finalText = `${originalText} ${prevState.state.currentText}`
          const { sections } = prevState.state
          prevState.setState({
            chapters: processChapters(
              finalText,
              sections,
              Object.keys(sections)[0]
            )
          })
        })
      }
    })
  }

  onCursorTimeChange = (cursorTime, chapterId, segmentId, timestampStart, timestampEnd) => {
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
      // this.saveRecordedTranscript()
      this.setState({
        // recordedChapters: this.state.chapters, 
        // recordedChapters: this.joinRecordedChapters(this.state.recordedChapters, this.state.chapters), 
        alreadyRecorded: true,
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
        recorder.start()
      })
    }
  }

  sendAsHorrribleTranscription = () => { }
  save = () => { }

  saveRecordedTranscript = () => {
    const { chapters } = this.state
    const copiedChapter = [...JSON.parse(JSON.stringify(chapters))]
    this.setState({ recordedChapters: copiedChapter })
  }

  render() {
    const {
      chapters,
      listOfTemplates,
      sections,
      currentTime,
      tags,
      seconds,
      initialCursor,
      // recordedAudioClip,
      recording
    } = this.state
    const usedSections = chapters.map(chapter => chapter.keyword)
    return (
      <Page preferences logo={inoviaLogo} title="">
        <EuiFlexGroup >
          <EuiFlexItem style={{ display: 'block', marginTop: '-50px' }}>
            <PersonalInformation info={{
              doktor: '',
              patient: '',
              personnummer: '',
              template: ''
            }} />
            <EuiSpacer size="l" />
            <Editor
              transcript={chapters}
              originalChapters={chapters}
              chapters={chapters}
              currentTime={currentTime}
              onCursorTimeChange={this.onCursorTimeChange}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              isDiffVisible
              templateId={'english2'}
              sectionHeaders={Object.keys(sections)}
              initialCursor={initialCursor}
            />

            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty style={{ color: '#000000' }} onClick={() => { }}>
                  Avbryt
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{
                    color: '#000000',
                    border: 'solid 1px black',
                    borderRadius: '25px'
                  }}
                  onClick={() => { }}>
                  Spara ändringar
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{
                    background: 'rgb(112, 221, 127)',
                    borderRadius: '25px',
                    color: 'black'
                  }}
                  onClick={() => { }}>
                  “Skicka för granskning”
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{
                    background: 'rgb(9, 99, 255)',
                    color: 'white',
                    borderRadius: '25px'
                  }}
                  onClick={() => { }}>
                  Skicka till Webdoc
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem
            style={{
              maxWidth: '400px',
              display: 'block',
              marginTop: '-50px'
            }}
          >
            <div style={{
              marginLeft: '-50vw',
              marginTop: '25px'
            }}>
              <Mic
                microphoneBeingPressed={recording}
                toggleRecord={this.toggleRecord}
                seconds={seconds}
              />
              <EuiButtonEmpty
                onClick={this.saveRecordedTranscript}
              > .</EuiButtonEmpty>
            </div>
            <div style={{
              marginTop: '-80px'
            }}>
              <Tags
                tags={tags}
                updateTags={this.onUpdateTags}
              />
              <EuiSpacer size="l" />
              <LiveTemplateEngine
                listOfTemplates={listOfTemplates}
                usedSections={usedSections}
                defaultTemplate={'english2'}
                updatedSections={this.updatedSections}
              />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
        {/* <EuiFlexGroup>
          <EuiFlexItem>
            <RecordList audioClip={recordedAudioClip} />
          </EuiFlexItem>
        </EuiFlexGroup> */}
      </Page>
    )
  }
}