/* eslint-disable no-console */
// @ts-ignore
import React, { Component } from 'react'
import {
  EuiButtonEmpty,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton
} from '@elastic/eui'
import api from '../api'
import Editor from '../components/Editor'
import Mic from '../components/Mic'
import LiveTemplateEngine from '../components/LiveTemplateEngine'
import interpolateArray from '../models/interpolateArray'
import PersonalInformation from '../components/PersonalInformation'
import Tags from '../components/Tags'
import io from 'socket.io-client'
import Page from '../components/Page'
import processChaptersLive from '../models/processChaptersLive'
import inoviaLogo from '../img/livediktering.png'
import * as recorder from '../utils/recorder'
import RecordList from '../components/RecordList'

export default class LiveDiktering extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  // eslint-disable-next-line max-len
  socketio = io.connect('wss://ilxgpu9002.inoviaai.se/audio', { transports: ['websocket'] })
  state = {
    recording: false,
    recordingAction: 'Starta',
    microphoneBeingPressed: false,
    listOfTemplates: [],
    chapters: [{ 
      keyword: 'KONTAKTORSAK', 
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
    recordedAudioClip: null
  }

  componentDidMount = () => {
    this.templates()
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }

  templates = async () => {
    const templateList = await api.getSectionTemplates()
    console.log('templates')
    console.log(templateList)
    this.setState({ listOfTemplates: templateList.data.templates })
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
    // micStream.stop()
    this.setState({ chapters })
  }

  convertToMono = (input) => {
    var splitter = this.audioContext.createChannelSplitter(2)
    var merger = this.audioContext.createChannelMerger(2)
    input.connect(splitter)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, 0, 1)
    return merger
  }

  validateSections = (updatedSectionNames) => {
    // const { sections, chapters } = this.state
    // // console.log('sections beta')
    // // console.log(sections)
    // // console.log('updated sections')
    // // console.log(updatedSectionNames)
    // // console.log('chapters')
    // // console.log(chapters)
    // if (JSON.stringify(sections) !== JSON.stringify(updatedSectionNames)) {
    //   // cheeck if the current sections are incompatible  
    //   // shuffle chapters according to the new template
    //   const firstKeyword = Object.keys(updatedSectionNames)[0]
    //   let updatedText = ''
    //   chapters.forEach((chapter) => {
    //     updatedText = `${updatedText} ${chapter.keyword}`
    //     chapter.segments.forEach((segment) => {
    //       updatedText = `${updatedText} ${segment.words}`
    //     })
    //   })
    //   updatedText = updatedText.replace(firstKeyword, '')
    //   // updatedText = updatedText.replace(/\s\s+/g, ' ') 
    //   updatedText = updatedText.replace(/ny rad/g, '')
    //   // updatedText = updatedText.replace(/\n/g, '')
    //   this.setState({
    //     chapters: processChaptersLive(updatedText, updatedSectionNames, firstKeyword),
    //     headerUpdatedChapters: processChaptersLive(updatedText, updatedSectionNames, firstKeyword)
    //   })
    // } // else do nothing 
  }

  updatedSections = (sections) => {
    console.log('before validating')
    console.log(sections)
    // this.validateSections(sections)
    this.setState({ sections })
  }

  // @ts-ignore
  gotStream = (stream) => {
    const { recording } = this.state
    const inputPoint = this.audioContext.createGain()
    // Create an AudioNode from the stream.
    const realAudioInput = this.audioContext.createMediaStreamSource(stream)

    let audioInput = realAudioInput
    audioInput = this.convertToMono(audioInput)
    audioInput.connect(inputPoint)

    const { createScriptProcessor, createJavaScriptNode } = this.audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode)
      .call(this.audioContext, 1024, 1, 1)
    const prevState = this
    scriptNode.onaudioprocess = function (audioEvent) {
      const {seconds} = prevState.state
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
    // updateAnalysers();
    // @ts-ignore
    this.socketio.on('add-transcript', function (text) {
      // add new recording to page
      const { originalText } = prevState.state
      prevState.setState({ currentText: text }, () => {
        // console.log('prevState.state.whole')
        const finalText = `${originalText} ${prevState.state.currentText}`
        // console.log(finalText)
        const { sections } = prevState.state
        // prevState.setState({ chapters: [{ keyword: 'Keyboard', segments: [{ words: '1 ', startTime: 0.0, endTime: 0.0 }, { words: '1 ', startTime: 0.0, endTime: 0.0 }, { words: '1 ', startTime: 0.0, endTime: 0.0 }] }] })
        prevState.setState({ chapters: processChaptersLive(finalText, sections, Object.keys(sections)[0]),
          headerUpdatedChapters: processChaptersLive(finalText, sections, Object.keys(sections)[0])
        })
        // prevState.setState({ chapters: processChapters(finalText, sections) })
      })
    })
  }

  // @ts-ignore
  onCursorTimeChange = (cursorTime) => {
    this.setState({ cursorTime })
  }

  initAudio = async () => {
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
    if (this.audioContext === null) this.audioContext = new this.AudioContext()
    const { recording } = this.state
    if (recording === true) {
      this.setState({ recording: false }, () => {
        // Close the socket
        recorder.stop(this.addClipHandler)
        this.audioContext.suspend()
      })
    } else {
      this.setState({ recording: true }, async () => {
        if (this.audioContext.state === 'suspended') {
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

  sendAsHorrribleTranscription = () => {}

  save = () => {}

  render() {
    const {
      chapters,
      listOfTemplates,
      sections,
      currentTime,
      tags,
      seconds,
      headerUpdatedChapters,
      initialCursor,
      recordedAudioClip,
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
              headerUpdatedChapters={headerUpdatedChapters}
              chapters={chapters}
              currentTime={currentTime}
              onCursorTimeChange={this.onCursorTimeChange}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              isDiffVisible
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
                defaultTemplate={'ext1'}
                updatedSections={this.updatedSections}
              />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <RecordList audioClip={recordedAudioClip} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}
