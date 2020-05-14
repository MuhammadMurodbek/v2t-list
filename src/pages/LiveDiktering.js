/* eslint-disable no-console */
// @ts-ignore
import React, { Component } from 'react'
// @ts-ignore
import {
  EuiButtonEmpty,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiI18n
} from '@elastic/eui'
import api from '../api'
import LiveEditor from '../components/LiveEditor'
import Mic from '../components/Mic'
import LiveTemplateEngine from '../components/LiveTemplateEngine'
import interpolateArray from '../models/interpolateArray'
import PersonalInformation from '../components/PersonalInformation'
import Tags from '../components/Tags'
import io from 'socket.io-client'
import Page from '../components/Page'
import processChapters from '../models/processChapters'
import inoviaLogo from '../img/livediktering.png'
import { addErrorToast } from '../components/GlobalToastList'

export default class LiveDiktering extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  // eslint-disable-next-line max-len
  socketio = io.connect('wss://ilxgpu9000.inoviaai.se/audio', {
    transports: ['websocket']
  })
  state = {
    recording: false,
    recordingAction: 'Starta',
    microphoneBeingPressed: false,
    listOfTemplates: [],
    chapters: [
      {
        keyword: 'KONTAKTORSAK',
        segments: [{ words: '...', startTime: 0.0, endTime: 0.0 }]
      }
    ],
    originalText: '',
    currentText: '',
    sections: {
      KONTAKTORSAK: [],
      AT: [],
      LUNGOR: [],
      BUK: [],
      DIAGNOS: []
    },
    isMicrophoneStarted: false,
    tags: [],
    seconds: 0,
    duration: 0.0,
    previousDuration: 0.0,
    previousCurrentTime: new Date(),
    initialRecordTime: null
  }

  componentDidMount = () => {
    this.templates()
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }

  templates = async () => {
    try {
      const templateList = await api.getSectionTemplates()
      console.log('templates')
      console.log(templateList)
      this.setState({ listOfTemplates: templateList.data.templates })
    } catch {
      addErrorToast()
    }
  }

  onSelectText = () => {
    // update later
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
    const { sections, chapters } = this.state
    // console.log('sections beta')
    // console.log(sections)
    // console.log('updated sections')
    // console.log(updatedSectionNames)
    // console.log('chapters')
    // console.log(chapters)
    if (JSON.stringify(sections) !== JSON.stringify(updatedSectionNames)) {
      // cheeck if the current sections are incompatible
      // shuffle chapters according to the new template
      let updatedText = ''
      chapters.forEach((chapter) => {
        updatedText = `${updatedText} ${chapter.keyword}`
        chapter.segments.forEach((segment) => {
          updatedText = `${updatedText} ${segment.words}`
        })
      })
      updatedText = updatedText.replace('KONTAKTORSAK', '')
      updatedText = updatedText.replace(/\s\s+/g, ' ')
      updatedText = updatedText.replace(/ny rad/g, '')
      updatedText = updatedText.replace(/\n/g, '')
      this.setState({
        chapters: processChapters(
          updatedText,
          updatedSectionNames,
          Object.keys(updatedSectionNames)[0]
        )
      })
    } // else do nothing
  }

  // @ts-ignore
  updatedSections = (sections) => {
    console.log('before validating')
    console.log(sections)
    this.validateSections(sections)
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

    const analyserNode = this.audioContext.createAnalyser()
    analyserNode.fftSize = 2048
    inputPoint.connect(analyserNode)
    const { createScriptProcessor, createJavaScriptNode } = this.audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode).call(
      this.audioContext,
      1024,
      1,
      1
    )
    const prevState = this
    scriptNode.onaudioprocess = function (audioEvent) {
      const {
        initialRecordTime,
        previousCurrentTime,
        microphoneBeingPressed,
        seconds
      } = prevState.state
      if (microphoneBeingPressed) {
        const currentTime = new Date()
        if (currentTime.getSeconds() !== previousCurrentTime.getSeconds()) {
          prevState.setState({
            seconds: seconds + 1,
            previousCurrentTime: currentTime,
            duration: Math.ceil(
              (currentTime.getTime() - initialRecordTime.getTime()) / 1000
            )
          })
        }
      }
      if (recording === true) {
        let input = audioEvent.inputBuffer.getChannelData(0)
        input = interpolateArray(input, 16000, 44100)
        // convert float audio data to 16-bit PCM
        var buffer = new ArrayBuffer(input.length * 2)
        var output = new DataView(buffer)
        for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]))
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
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
        prevState.setState({
          chapters: processChapters(
            finalText,
            sections,
            Object.keys(sections)[0]
          )
        })
        // prevState.setState({ chapters: processChapters(finalText, sections) })
      })
    })
  }

  // @ts-ignore
  onCursorTimeChange = () => {}

  // @ts-ignore
  initAudio = () => {
    if (navigator.mediaDevices === undefined) {
      // @ts-ignore
      navigator.mediaDevices = {}
    }

    // Some browsers partially implement mediaDevices.
    // We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia =
          // @ts-ignore
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia

        // Some browsers just don't implement it
        // - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(
            new Error('getUserMedia is not implemented in this browser')
          )
        }

        // Otherwise, wrap the call to the old
        // navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })
      }
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.gotStream(stream)
      })
      .catch(function (err) {
        console.log(`${err.name} : ${err.message}`)
      })
  }

  // @ts-ignore
  toggleRecord = () => {
    // @ts-ignore
    if (this.audioContext === null) this.audioContext = new this.AudioContext()
    const {
      microphoneBeingPressed,
      originalText,
      currentText,
      initialRecordTime
    } = this.state
    if (microphoneBeingPressed === true) {
      // console.log('stop recording')
      this.setState({ recording: false }, () => {
        this.setState({ microphoneBeingPressed: false })
        this.setState({ recordingAction: 'Starta' })
        // Close the socket
        this.socketio.emit('end-recording')
        this.socketio.close()
        this.setState({ originalText: `${originalText} ${currentText}` })
      })
    } else {
      // console.log('start recording')
      // console.log(this.socketio.connected)
      this.setState({ recording: true }, () => {
        if (!initialRecordTime) {
          const recordTime = new Date()
          this.setState({
            initialRecordTime: recordTime
          })
        }
        // console.log('then')
        // console.log(this.socketio.connected)
        this.setState({ microphoneBeingPressed: true })
        this.setState({ recordingAction: 'Avsluta' })
        this.initAudio()
        // console.log('button is clicked')
        this.socketio.emit('start-recording', {
          numChannels: 1,
          bps: 16,
          fps: parseInt(this.audioContext.sampleRate)
        })
      })
    }
  }

  // @ts-ignore
  sendAsHorrribleTranscription = () => {}

  // @ts-ignore
  save = () => {
    /* Check the template compatibility, 
    // if the section headers don't belong to the template, 
    // notify the user and clear up the keywords and move 
    // the keyword as a regular text
    // as it was actually said by the speaker
    */
    if (!this.socketio.connected) {
      this.socketio.connect('wss://ilxgpu9000.inoviaai.se/audio', {
        transports: ['websocket']
      })
    }
  }

  render() {
    const {
      chapters,
      microphoneBeingPressed,
      listOfTemplates,
      sections,
      tags,
      seconds
    } = this.state
    const usedSections = chapters.map((chapter) => chapter.keyword)
    return (
      <Page preferences logo={inoviaLogo} title="">
        <EuiFlexGroup>
          <EuiFlexItem style={{ display: 'block', marginTop: '-50px' }}>
            <PersonalInformation
              info={{
                doktor: '',
                patient: '',
                personnummer: '',
                template: ''
              }}
            />
            <EuiSpacer size="l" />
            <LiveEditor
              transcript={chapters}
              originalChapters={chapters}
              chapters={chapters}
              currentTime={0.0}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              onCursorTimeChange={this.onCursorTimeChange}
              isDiffVisible={false}
              sectionHeaders={Object.keys(sections)}
              initialCursor={0}
            />

            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty style={{ color: '#000000' }} onClick={() => {}}>
                  <EuiI18n token="cancel" default="Cancel" />
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{
                    color: '#000000',
                    border: 'solid 1px black',
                    borderRadius: '25px'
                  }}
                  onClick={() => {}}
                >
                  <EuiI18n token="saveChanges" default="Save changes" />
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{
                    background: 'rgb(112, 221, 127)',
                    borderRadius: '25px',
                    color: 'black'
                  }}
                  onClick={() => {}}
                >
                  <EuiI18n
                    token="submitForReview"
                    default="Submit for review"
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
                  onClick={() => {}}
                >
                  <EuiI18n token="sendToWebdoc" default="Send to Webdoc" />
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
            <div
              style={{
                marginLeft: '-50vw',
                marginTop: '25px'
              }}
            >
              <Mic
                microphoneBeingPressed={microphoneBeingPressed}
                toggleRecord={this.toggleRecord}
                seconds={seconds}
              />
            </div>
            <div
              style={{
                marginTop: '-80px'
              }}
            >
              <Tags tags={tags} updateTags={this.onUpdateTags} />
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
      </Page>
    )
  }
}
