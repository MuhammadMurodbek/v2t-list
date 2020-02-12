/* eslint-disable no-console */
import React, { Component } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui'
import api from '../api'
import Mic from '../components/Mic'
import interpolateArray from '../models/interpolateArray'
import io from 'socket.io-client'
import Page from '../components/Page'
import inoviaLogo from '../img/livediktering.png'
import GuidedLiveEditor from '../components/live/GuidedLiveEditor'
import { EuiSpacer } from '@elastic/eui'

export default class LiveDiktering extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  // eslint-disable-next-line max-len
  socketio = io.connect('wss://ilxgpu9000.inoviaai.se/audio', { transports: ['websocket'] })
  state = {
    recording: false,
    recordingAction: 'Starta',
    microphoneBeingPressed: false,
    listOfTemplates: [],
    chapters: [{
      keyword: 'KONTAKTORSAK',
      segments: [{ words: '...', startTime: 0.00, endTime: 0.00 }]
    }],
    originalText: '',
    currentText: '',
    sections: {
      'KONTAKTORSAK': [],
      'AT': [],
      'LUNGOR': [],
      'BUK': [],
      'DIAGNOS': []
    },
    isMicrophoneStarted: false,
    tags: [],
    finalText:'hello'
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

  convertToMono = (input) => {
    var splitter = this.audioContext.createChannelSplitter(2)
    var merger = this.audioContext.createChannelMerger(2)
    input.connect(splitter)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, 0, 1)
    return merger
  }

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
    const scriptNode = (createScriptProcessor || createJavaScriptNode)
      .call(this.audioContext, 1024, 1, 1)
    const prevState = this
    scriptNode.onaudioprocess = function (audioEvent) {
      if (recording === true) {
        let input = audioEvent.inputBuffer.getChannelData(0)
        input = interpolateArray(input, 16000, 44100)
        // convert float audio data to 16-bit PCM
        var buffer = new ArrayBuffer(input.length * 2)
        var output = new DataView(buffer)
        for (var i = 0, offset = 0; i < input.length; i++ , offset += 2) {
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
    this.socketio.on('add-transcript', function (text) {
      // add new recording to page
      const { originalText } = prevState.state
      console.log('text')
      console.log(text)
      console.log('text end ')
      prevState.setState({ currentText: text }, () => {
        // console.log('prevState.state.whole')
        const finalText = `${originalText} ${prevState.state.currentText}`
        console.log(finalText)
        // prevState.setState({ chapters: processChapters(finalText) })
        prevState.setState({ finalText })
      })
    })
  }

  initAudio = () => {
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {}
    }

    // Some browsers partially implement mediaDevices.
    // We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function (constraints) {

        // First get ahold of the legacy getUserMedia, if present
        const getUserMedia
          = navigator.webkitGetUserMedia || navigator.mozGetUserMedia

        // Some browsers just don't implement it 
        // - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise
            .reject(
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

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.gotStream(stream)
      })
      .catch(function (err) {
        console.log(`${err.name} : ${err.message}`)
      })
  }


  toggleRecord = () => {
    if (this.audioContext === null) this.audioContext = new this.AudioContext()
    const { microphoneBeingPressed, originalText, currentText } = this.state
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
      this.setState({ recording: true }, () => {
        this.setState({ microphoneBeingPressed: true })
        this.setState({ recordingAction: 'Avsluta' })
        this.initAudio()
        this.socketio.emit('start-recording', {
          numChannels: 1,
          bps: 16,
          fps: parseInt(this.audioContext.sampleRate)
        })
      })
    }
  }

  render() {
    const {
      recordingAction,
      microphoneBeingPressed,
      currentText
    } = this.state

    return (
      <Page preferences logo={inoviaLogo}>
        <EuiFlexGroup>
          <EuiFlexItem grow={false} style={{ maxWidth: 100, marginLeft: 30 }}>
            <Mic
              recordingAction={recordingAction}
              microphoneBeingPressed={microphoneBeingPressed}
              toggleRecord={this.toggleRecord}
            />
            <EuiSpacer size="xxl" />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          {/* <EuiFlexItem>
            {this.state.finalText}
          </EuiFlexItem> */}
          <EuiFlexItem>
            <GuidedLiveEditor content={currentText}/>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}


