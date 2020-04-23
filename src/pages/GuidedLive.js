// @ts-nocheck
/* eslint-disable no-console */
import React, { Component } from 'react'
import { EuiSpacer, EuiFlexGroup, EuiFlexItem } from '@elastic/eui'
import api from '../api'
import Mic from '../components/Mic'
import interpolateArray from '../models/interpolateArray'
import io from 'socket.io-client'
import Page from '../components/Page'
import GuidedLiveEditor from '../components/live/GuidedLiveEditor'

import * as recorder from '../utils/recorder'
import RecordList from '../components/RecordList'

export default class GuidedLive extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = null
  socketio = io.connect('wss://ilxgpu9000.inoviaai.se/audio', { transports: ['websocket'] })
  state = {
    recording: false,
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
    finalText: '',
    counter: 0,
    writeAudioMessage: 'write-audio-pnr',
    templatesForMenu: [],
    seconds: 0,
    recordedAudioClip: null
  }

  componentDidMount = () => {
    this.templates()
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }

  componentWillUnmount() {
    recorder.clear()
  }

  templates = async () => {
    const templateList = await api.getSectionTemplates()
    const tempTemplates = templateList.data.templates.map((template) => {
      return { name: template.name, id: template.id }
    })
    const finalTemplates = { id: 0, title: 'Journalmallar', items: tempTemplates }
    this.setState({ templatesForMenu: finalTemplates })
    this.setState({ 
      listOfTemplates: templateList.data.templates, templatesForMenu: finalTemplates 
    })
  }

  convertToMono = (input) => {
    const splitter = this.audioContext.createChannelSplitter(2)
    const merger = this.audioContext.createChannelMerger(2)
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

    const { createScriptProcessor, createJavaScriptNode } = this.audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode)
      .call(this.audioContext, 1024, 1, 1)
    const prevState = this

    scriptNode.onaudioprocess = (audioEvent) => {
      if(prevState.state.seconds !== Math.ceil(this.audioContext.currentTime)) {
        prevState.setState({
          seconds: Math.ceil(this.audioContext.currentTime)
        })
      }
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
        // console.log(this.state.writeAudioMessage)
        if (this.state.counter === 4) {
          prevState.setState({
            writeAudioMessage: 'write-audio'
          })
        }
        prevState.socketio.emit(prevState.state.writeAudioMessage, buffer)
      }
    }

    inputPoint.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    const zeroGain = this.audioContext.createGain()
    zeroGain.gain.value = 0.0
    inputPoint.connect(zeroGain)
    zeroGain.connect(this.audioContext.destination)

    

    this.socketio.on('add-transcript-pnr', function (text) {
      const { originalText } = prevState.state
      prevState.setState({ currentText: text }, () => {
        const finalText = `${originalText} ${prevState.state.currentText}`
        prevState.setState({ finalText, counter: prevState.state.counter + 1 })
      })
    })

    this.socketio.on('add-transcript', function (text) {
      if (text.includes('slut diktat') || text.includes('slut på diktat')) {
        prevState.setState({ recording: false }, () => {
          prevState.socketio.emit('end-recording')
          prevState.socketio.close()
          recorder.stop()
        })
      } else {
        prevState.setState({ currentText: text }, () => {
          prevState.setState({ finalText: text , counter: prevState.state.counter + 1 })
        })
      }
    })
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
      this.setState({ recording: true }, async() => {
        if(this.audioContext.state === 'suspended') {
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

  render() {
    const {
      recording, finalText, currentText,
      listOfTemplates, templatesForMenu, seconds,
      recordedAudioClip
    } = this.state

    return (
      <Page preferences title="Live Flow">
        <EuiFlexGroup justifyContent="center">
          <EuiFlexItem grow={false} style={{ maxWidth: 300, marginLeft: 30 }}>
            <Mic
              microphoneBeingPressed={recording}
              toggleRecord={this.toggleRecord}
              seconds={seconds}
            />
            <EuiSpacer size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <GuidedLiveEditor
              prevContent={finalText}
              currentContent={currentText}
              listOfTemplates={listOfTemplates}
              templatesForMenu={templatesForMenu}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <RecordList audioClip={recordedAudioClip}/>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}


