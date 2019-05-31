/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-console */
/* eslint-disable no-alert */
import React, { Component } from 'react'
import axios from 'axios'
import {
  EuiFlexGroup, EuiFlexItem, EuiButton, EuiSpacer, EuiLoadingChart, EuiText, EuiTextColor
} from '@elastic/eui'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Page from '../components/Page'
import Mic from '../components/Mic'
import ResetBar from '../components/ResetBar'
import retrieveNewId from '../models/retrieveNewId'
import capitalize from '../models/textProcessing/capitalize'
import mergeLeftRightBuffers from '../models/audioProcessing/mergeLeftRightBuffers'
import bufferSilenceCount from '../models/audioProcessing/bufferSilenceCount'
import wordsToTranscript from '../models/textProcessing/wordsToTranscript'
import '../styles/editor.css'
import '../styles/player.css'

export default class LivePage extends Component {
  audioInput = null

  jsAudioNode = null

  state = {
    transcriptId: null,
    postURL: 'http://v2t-2/api_aiva/v1/predict/stereo',
    bufferSize: 4096,
    sampleRate: 44100,
    numberOfAudioChannels: 2,
    recordingAction: 'start',
    leftChannel: [],
    rightChannel: [],
    chunkLeftChannel: [],
    chunkRightChannel: [],
    recordingLength: 0,
    chunkRecordingLength: 0,
    microphoneBeingPressed: false,
    silentBuffersInRow: 0,
    keywords: [],
    reservedKeywords: ['at', 'lungor', 'buk', 'diagnos', 'at ', 'lungor ', 'buk ', 'diagnos '],
    originalChapters: [],
    recordedDiagnos: [],
    buffer: null,
    waitingForServer: false,
    showCancelBar: false
  }

  componentDidMount = async () => {
    this.tagsRef = React.createRef()
    const transcriptId = await retrieveNewId()
    if (transcriptId.data.id) {
      this.setState({
        transcriptId: transcriptId.data.id
      })
    }
  }

  startRecord = () => {
    const { numberOfAudioChannels } = this.state
    this.setState({
      microphoneBeingPressed: true,
      recordingAction: 'stop'
    })
    const Storage = {}
    Storage.ctx = new AudioContext()
    const bufferSize = 4096
    if (Storage.ctx.createJavaScriptNode) {
      this.jsAudioNode = Storage.ctx.createJavaScriptNode(
        bufferSize, numberOfAudioChannels, numberOfAudioChannels
      )
    } else if (Storage.ctx.createScriptProcessor) {
      this.jsAudioNode = Storage.ctx.createScriptProcessor(
        bufferSize, numberOfAudioChannels, numberOfAudioChannels
      )
    } else {
      alert('WebAudio API has no support on this browser.')
    }
    this.jsAudioNode.connect(Storage.ctx.destination)

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((microphone) => {
        this.audioInput = Storage.ctx.createMediaStreamSource(microphone)
        this.audioInput.connect(this.jsAudioNode)
        this.jsAudioNode.onaudioprocess = this.onAudioProcess
      })
      .catch((onMicrophoneCaptureError) => {
        console.log(onMicrophoneCaptureError)
      })
  }

  mergeCallbackChunk = (buffer, view) => {
    const blob = new Blob([view], { type: 'audio/wav' })

    /*
      const a = document.createElement('a')
      document.body.appendChild(a)
      a.style = 'display: none'
      // download blob
      const url = window.URL.createObjectURL(blob)
      a.href = url
      a.download = 'a.wav'
      a.click()
      window.URL.revokeObjectURL(url)
    */

    this.getResultFromServer(blob)
    this.setState({ leftChannel: [] })
    this.setState({ rightChannel: [] })
    this.setState({ chunkLeftChannel: [] })
    this.setState({ chunkRightChannel: [] })
    this.setState({ recordingLength: 0 })
    this.setState({ chunkRecordingLength: 0 })
  }

  liveTranscrption = (respondedData, buffer) => {
    const { originalChapters, reservedKeywords } = this.state
    const words = respondedData.split(' ')
    const receivedTranscriptsWithTimeInfo = wordsToTranscript(words, reservedKeywords)
    const updatedTranscript = originalChapters
    receivedTranscriptsWithTimeInfo.forEach((receivedTranscript) => {
      let currentKeyword = ''
      if (receivedTranscript.keyword === '' && updatedTranscript.length === 0) {
        currentKeyword = 'general'
      } else {
        currentKeyword = receivedTranscript.keyword
      }

      if (currentKeyword !== '') {
        updatedTranscript.push({
          keyword: currentKeyword,
          segments: receivedTranscript.segments
        })
      } else {
        updatedTranscript[updatedTranscript.length - 1]
          .segments.push(...receivedTranscript.segments)
      }
    })

    // Capitalize transcript
    updatedTranscript.forEach((keywordsAndSegments) => {
      for (let i = 0; i < keywordsAndSegments.segments.length; i += 1) {
        if (keywordsAndSegments.segments[i].words.length !== 0) {
          keywordsAndSegments.segments[i].words = capitalize(keywordsAndSegments.segments[i].words)
          break
        }
      }
    })

    // Update code section
    this.searchAndUpdateTag(updatedTranscript)
    this.setState({
      originalChapters: updatedTranscript,
      buffer
    })
  }

  searchAndUpdateTag = async (updateTranscript) => {
    // const codeData = await axios.post('/api/v1/code-service/search', {
    //   text: 'j301'
    // })

    this.setState({
      recordedDiagnos: [{
        id: 'J301',
        description: 'Allergisk rinit orsakad av pollen'
      }]
    })
    // Purpose of doing this is to use free text search
    // if (codeData.data !== null) {
    //   console.log(codeData)
    // }
  }

  getResultFromServer = (buffer) => {
    const { postURL } = this.state
    axios({
      method: 'post',
      url: postURL,
      data: buffer,
      cache: false,
      contentType: 'application/octet-stream'
    }).then((response) => {
      this.setState({ waitingForServer: false })
      console.log('received response')
      console.log(response)
      let respondedData = response.data
      if (typeof (respondedData) !== 'string') {
        respondedData = respondedData.toString()
      }
      this.liveTranscrption(respondedData, buffer)
    }).catch((err) => {
      throw Error(err)
    })
  }

  stopRecord = () => {
    this.setState({
      microphoneBeingPressed: false,
      recordingAction: 'start',
      waitingForServer: true
    })

    const intervalId = setInterval(() => {
      const { microphoneBeingPressed } = this.state
      if (microphoneBeingPressed === false) {
        this.processAudio()
        clearInterval(intervalId)
      }
    }, 0.0001)
  }

  processAudio = () => {
    this.audioInput.disconnect()
    this.jsAudioNode.disconnect()
    const {
      sampleRate,
      numberOfAudioChannels,
      chunkRecordingLength,
      chunkLeftChannel,
      chunkRightChannel
    } = this.state
    mergeLeftRightBuffers({
      sampleRate,
      desiredSampRate: 16000,
      numberOfAudioChannels,
      internalInterleavedLength: chunkRecordingLength,
      leftBuffers: chunkLeftChannel,
      rightBuffers: numberOfAudioChannels === 1 ? [] : chunkRightChannel
    }, this.mergeCallbackChunk)
  }

  onAudioProcess = (e) => {
    const {
      leftChannel,
      chunkLeftChannel,
      rightChannel,
      chunkRightChannel,
      recordingLength,
      bufferSize,
      chunkRecordingLength,
      numberOfAudioChannels
    } = this.state

    const left = e.inputBuffer.getChannelData(0)
    const tempLeftChannel = leftChannel
    const tempChunkLeftChannel = chunkLeftChannel
    const right = e.inputBuffer.getChannelData(1)
    const tempRightChannel = rightChannel
    const tempChunkRightChannel = chunkRightChannel

    tempLeftChannel.push(new Float32Array(left))
    tempChunkLeftChannel.push(new Float32Array(left))
    tempRightChannel.push(new Float32Array(right))
    tempChunkRightChannel.push(new Float32Array(right))

    this.setState({ leftChannel: tempLeftChannel })
    this.setState({ chunkLeftChannel: tempChunkLeftChannel })
    this.setState({ rightChannel: tempRightChannel })
    this.setState({ chunkRightChannel: tempChunkRightChannel })
    this.detectSilence(chunkLeftChannel, chunkRightChannel, numberOfAudioChannels)
    this.setState({ recordingLength: (recordingLength + bufferSize) })
    this.setState({ chunkRecordingLength: (chunkRecordingLength + bufferSize) })
  }

  clearChunkRecordedData = () => {
    this.setState({ chunkLeftChannel: [] })
    this.setState({ chunkRightChannel: [] })
    this.setState({ chunkRecordingLength: 0 })
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText })
  }

  onUpdateTranscript = (chapters) => {
  }

  onValidateTranscript = (errors) => {
    this.setState({ errors })
  }

  detectSilence = (lcX, rcX, numberOfAudioChannels) => {
    const { silentBuffersInRow } = this.state
    const lc = lcX[lcX.length - 1]
    let count = bufferSilenceCount(lc)
    let totalSize = lc.length

    if (numberOfAudioChannels === 2) {
      const rc = rcX[rcX.length - 1]
      count += bufferSilenceCount(rc)
      totalSize += rc.length
    }

    if (count / totalSize > 0.5) {
      this.setState({ silentBuffersInRow: silentBuffersInRow + 1 })
    } else {
      this.setState({ silentBuffersInRow: 0 })
    }
  }

  onUpdateTags = (tags) => {
    // Update
    this.setState({ recordedDiagnos: tags })
  }

  finalize = () => {
    this.save()
  }

  save = () => {
    // Create a new transcript
    const { buffer, transcriptId, originalChapters } = this.state
    let tempTranscript = ''
    let tempKeywords = ''
    originalChapters.forEach((originalChapter) => {
      tempKeywords = `${tempKeywords + originalChapter.keyword.toLowerCase()},`
      tempTranscript = `${tempTranscript + originalChapter.keyword.toLowerCase()} `
      originalChapter.segments.forEach((seg) => {
        tempTranscript = `${tempTranscript + seg.words.toLowerCase()} `
      })
    })

    const blob = new Blob([buffer], { type: 'audio/wav' })
    const fd = new FormData()
    fd.append('audioChunk', blob)
    fd.append('transcript', tempTranscript)
    fd.append('keywords', tempKeywords)
    axios({
      method: 'post',
      url: `/api/v1/v2t-service-realtime/save/${transcriptId}/chunk/0`,
      data: fd,
      cache: false
    }).then(() => {
      alert('Send to Co-worker')
      window.location.replace('/')
    }).catch((err) => {
      console.log('err')
      console.log(err)
      throw Error(err)
    })
  }

  showHideCancelBox = () => {
    const { showCancelBar } = this.state
    console.log(showCancelBar)
    this.setState({
      showCancelBar: !showCancelBar
    })
  }

  toggleRecord = () => {
    const { microphoneBeingPressed } = this.state
    if (microphoneBeingPressed === false) {
      this.startRecord()
    } else {
      this.stopRecord()
    }
  }

  clearState = () => {
    const { showCancelBar } = this.state
    this.setState({ showCancelBar: !showCancelBar })
    this.setState({
      recordingAction: 'start',
      leftChannel: [],
      rightChannel: [],
      chunkLeftChannel: [],
      chunkRightChannel: [],
      recordingLength: 0,
      chunkRecordingLength: 0,
      microphoneBeingPressed: false,
      silentBuffersInRow: 0,
      keywords: [],
      reservedKeywords: ['at', 'lungor', 'buk', 'diagnos', 'at ', 'lungor ', 'buk ', 'diagnos '],
      originalChapters: [],
      recordedDiagnos: [],
      buffer: null,
      waitingForServer: false
    })
  }

  render() {
    const {
      microphoneBeingPressed,
      originalChapters,
      keywords,
      recordingAction,
      recordedDiagnos,
      waitingForServer,
      showCancelBar
    } = this.state
    return (
      <Page title="Live Transcript">
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <Mic
          recordingAction={recordingAction}
          microphoneBeingPressed={microphoneBeingPressed}
          toggleRecord={this.toggleRecord}
        />
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiText style={waitingForServer === true ? { display: 'block' } : { display: 'none' }}>
          <h3>
            <EuiLoadingChart size="xl" />
            &nbsp;&nbsp;
            <EuiTextColor color="default">Getting response from server</EuiTextColor>
          </h3>
        </EuiText>
        <EuiFlexGroup wrap>
          <EuiFlexItem>
            <Editor
              originalChapters={originalChapters}
              chapters={originalChapters}
              keywords={keywords}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              validateTranscript={this.onValidateTranscript}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <Tags
              tags={recordedDiagnos}
              updateTags={this.onUpdateTags}
              ref={this.tagsRef}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={originalChapters.length !== 0 ? { display: 'flex' } : { display: 'none' }}>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="secondary" onClick={this.save}>Submit to Co-worker</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="danger" onClick={this.showHideCancelBox}>Cancel</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <ResetBar
          showCancelBar={showCancelBar}
          showHideCancelBox={this.showHideCancelBox}
          resetState={this.clearState}
        />
      </Page>
    )
  }
}
