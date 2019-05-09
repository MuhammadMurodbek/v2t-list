/* eslint-disable no-console */
/* eslint-disable no-alert */
import React, { Component } from 'react'
import axios from 'axios'
import {
  EuiFlexGroup, EuiFlexItem, EuiButton, EuiSpacer
} from '@elastic/eui'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Page from '../components/Page'
import '../styles/editor.css'

export default class LivePage extends Component {
  audioInput = null

  jsAudioNode = null

  state = {
    bufferSize: 4096,
    sampleRate: 44100,
    numberOfAudioChannels: 2,
    recording: false,
    leftChannel: [],
    rightChannel: [],
    chunkLeftChannel: [],
    chunkRightChannel: [],
    recordingLength: 0,
    chunkRecordingLength: 0,
    microphoneBeingPressed: false,
    silentBuffersInRow: 0,
    keywords: [],
    reservedKeywords: ['at', 'lungor', 'buk', 'diagnos', 'var', 'den'],
    originalChapters: [],
    tags: []
  }

  /*
    Sample original chapter

    originalChapters: [{
      keyword: 'general',
      segments: [{
        endTime: 1.72,
        startTime: 0,
        words: 'och så dikterar '
      }, {
        endTime: 1.73,
        startTime: 4.24,
        words: 'och så dikterar '
      }]
    }]
  */

  componentDidMount = () => {
    this.tagsRef = React.createRef()
  }


  startRecord = () => {
    const { numberOfAudioChannels } = this.state
    this.setState({ microphoneBeingPressed: true })
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
        this.setState({recording: true})
        this.jsAudioNode.onaudioprocess = this.onAudioProcess
      })
      .catch((onMicrophoneCaptureError) => {
        console.log(onMicrophoneCaptureError)
      })
  }

  mergeCallbackChunk = (buffer, view) => {
    console.log('in the callback for chunk')
    const blob = new Blob([view], { type: 'audio/wav' })
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'

    // download blob
    // const url = window.URL.createObjectURL(blob)
    // a.href = url
    // a.download = 'a.wav'
    // a.click()
    // window.URL.revokeObjectURL(url)

    this.setState({ leftChannel: [] })
    this.setState({ rightChannel: [] })
    this.setState({ chunkLeftChannel: [] })
    this.setState({ chunkRightChannel: [] })
    this.setState({ recordingLength: 0 })
    this.setState({ chunkRecordingLength: 0 })
    this.getResultFromServer(blob)
  }

  liveTranscrption = (respondedData) => {
    const { originalChapters, reservedKeywords } = this.state
    const words = respondedData.split(' ')
    const newTranscript = []
    let newKeywords = []
    let newSegments = []
    console.log('words')
    console.log(words)
    const recordedSegments = []
    // Postprocessing is formatting of the text, punkt, uppercase etc
    // Textprocess is where we find a code, keywords and save in workflow
    words.forEach((word) => {
      let wordBeforeProcessing = word
      // Postprocess
      if (wordBeforeProcessing === 'punkt') {
        wordBeforeProcessing = '.'
      }

      // Text Process
      if (reservedKeywords.includes(wordBeforeProcessing)) {
        newKeywords.push(word)
        newSegments = []
      } else {
        newSegments.push(word)
      }
    })

    if (newKeywords.length === 0 && originalChapters.length === 0) {
      newKeywords = ['general']
    }

    console.log('newKeywords')
    console.log(newKeywords)
    console.log('newSegments')
    console.log(newSegments)

    newSegments.forEach((newSegment) => {
      if (newSegment.length > 0) {
        recordedSegments.push({
          endTime: 0,
          startTime: 0,
          words: `${newSegment} `
        })
      }
    })
    // newSegments = []
    newTranscript.push({
      keyword: newKeywords[newKeywords.length - 1],
      segments: recordedSegments
    })

    let updatedTranscript = originalChapters
    if (newKeywords.length !== 0) {
      updatedTranscript = updatedTranscript.push(newTranscript[0])
    } else {
      console.log('recorded segments')
      console.log(recordedSegments)
      recordedSegments.forEach((recordedSegment) => {
        updatedTranscript[updatedTranscript.length - 1].segments.push(recordedSegment)
      })
    }

    console.log('new Transcript')
    console.log(newTranscript)
    console.log('updated transcript 1')
    console.log(originalChapters)
    this.setState({
      originalChapters
    })
  }

  getResultFromServer = (buffer) => {
    console.log('attemp to send data')
    axios({
      method: 'post',
      url: 'https://v2t-1.inoviagroup.se/api_aiva/v1/predict/stereo',
      data: buffer,
      cache: false,
      contentType: 'application/octet-stream'
      // data: temp,
    }).then((response) => {
      console.log('response')
      // console.log(response)
      // Print the text from the response
      let respondedData = response.data
      if (typeof (respondedData) !== 'string') {
        respondedData = respondedData.toString()
      }
      console.log(respondedData)
      this.liveTranscrption(respondedData)
    }).catch((err) => {
      throw Error(err)
    })
  }

  stopRecord = () => {
    const {
      sampleRate,
      numberOfAudioChannels,
      chunkRecordingLength,
      chunkLeftChannel,
      chunkRightChannel
    } = this.state
    this.setState({ microphoneBeingPressed: false })
    this.audioInput.disconnect()
    this.jsAudioNode.disconnect()
    this.mergeLeftRightBuffers({
      sampleRate,
      desiredSampRate: 16000,
      numberOfAudioChannels,
      internalInterleavedLength: chunkRecordingLength,
      leftBuffers: chunkLeftChannel,
      rightBuffers: numberOfAudioChannels === 1 ? [] : chunkRightChannel
    }, this.mergeCallbackChunk)
  }


  mergeLeftRightBuffers = (config, callback) => {
    const { numberOfAudioChannels, internalInterleavedLength, desiredSampRate } = config
    let leftBuffers = config.leftBuffers.slice(0)
    let rightBuffers = config.rightBuffers.slice(0)
    let { sampleRate } = config

    if (numberOfAudioChannels === 2) {
      leftBuffers = this.mergeBuffers(leftBuffers, internalInterleavedLength)
      rightBuffers = this.mergeBuffers(rightBuffers, internalInterleavedLength)
      if (desiredSampRate) {
        leftBuffers = this.interpolateArray(leftBuffers, desiredSampRate, sampleRate)
        rightBuffers = this.interpolateArray(rightBuffers, desiredSampRate, sampleRate)
      }
    }

    if (numberOfAudioChannels === 1) {
      leftBuffers = this.mergeBuffers(leftBuffers, internalInterleavedLength)
      if (desiredSampRate) {
        leftBuffers = this.interpolateArray(leftBuffers, desiredSampRate, sampleRate)
      }
    }

    // set sample rate as desired sample rate
    if (desiredSampRate) {
      sampleRate = desiredSampRate
    }
    let interleaved

    if (numberOfAudioChannels === 2) {
      interleaved = this.interleave(leftBuffers, rightBuffers)
    }

    if (numberOfAudioChannels === 1) {
      interleaved = leftBuffers
    }

    const interleavedLength = interleaved.length

    // create wav file
    const resultingBufferLength = 44 + interleavedLength * 2
    const buffer = new ArrayBuffer(resultingBufferLength)
    const view = new DataView(buffer)

    // RIFF chunk descriptor/identifier
    this.writeUTFBytes(view, 0, 'RIFF')

    // RIFF chunk length
    view.setUint32(4, 44 + interleavedLength * 2, true)

    // RIFF type
    this.writeUTFBytes(view, 8, 'WAVE')

    // format chunk identifier
    // FMT sub-chunk
    this.writeUTFBytes(view, 12, 'fmt ')

    // format chunk length
    view.setUint32(16, 16, true)

    // sample format (raw)
    view.setUint16(20, 1, true)

    // stereo (2 channels)
    view.setUint16(22, numberOfAudioChannels, true)

    // sample rate
    view.setUint32(24, sampleRate, true)

    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true)

    // block align (channel count * bytes per sample)
    view.setUint16(32, numberOfAudioChannels * 2, true)

    // bits per sample
    view.setUint16(34, 16, true)

    // data sub-chunk
    // data chunk identifier
    this.writeUTFBytes(view, 36, 'data')

    // data chunk length
    view.setUint32(40, interleavedLength * 2, true)

    // write the PCM samples
    const lng = interleavedLength
    let index = 44
    const volume = 1

    for (let i = 0; i < lng; i += 1) {
      view.setInt16(index, interleaved[i] * (0x7FFF * volume), true)
      index += 2
    }
    callback(buffer, view)
  }

  interleave = (leftChannel, rightChannel) => {
    const length = leftChannel.length + rightChannel.length
    const result = new Float64Array(length)
    let inputIndex = 0
    for (let index = 0; index < length;) {
      result[index += 1] = leftChannel[inputIndex]
      result[index += 1] = rightChannel[inputIndex]
      inputIndex += 1
    }
    return result
  }

  mergeBuffers = (channelBuffer, rLength) => {
    console.log('in the callback ....')
    const result = new Float64Array(rLength)
    let offset = 0
    const lng = channelBuffer.length
    for (let i = 0; i < lng; i += 1) {
      const buffer = channelBuffer[i]
      result.set(buffer, offset)
      offset += buffer.length
    }
    return result
  }

  // for changing the sampling rate, reference:
  // http://stackoverflow.com/a/28977136/552182
  interpolateArray = (data, newSampleRate, oldSampleRate) => {
    const fitCount = Math.round(data.length * (newSampleRate / oldSampleRate))
    const newData = []
    const springFactor = Number((data.length - 1) / (fitCount - 1))
    newData[0] = data // newData[0] = data[0] // for new allocation
    for (let i = 1; i < fitCount - 1; i += 1) {
      const tmp = i * springFactor
      const before = Number(Math.floor(tmp)).toFixed()
      const after = Number(Math.ceil(tmp)).toFixed()
      const atPoint = tmp - before
      newData[i] = this.linearInterpolate(data[before], data[after], atPoint)
    }
    newData[fitCount - 1] = data[data.length - 1] // for new allocation
    return newData
  }

  linearInterpolate = (before, after, atPoint) => before + (after - before) * atPoint

  writeUTFBytes = (view, offset, string) => {
    const lng = string.length
    for (let i = 0; i < lng; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
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
    tempLeftChannel.push(new Float32Array(left))
    this.setState({ leftChannel: tempLeftChannel })
    const tempChunkLeftChannel = chunkLeftChannel
    tempChunkLeftChannel.push(new Float32Array(left))
    this.setState({ chunkLeftChannel: tempChunkLeftChannel })
    const right = e.inputBuffer.getChannelData(1)
    const tempRightChannel = rightChannel
    tempRightChannel.push(new Float32Array(right))
    this.setState({ rightChannel: tempRightChannel })

    const tempChunkRightChannel = chunkRightChannel
    tempChunkRightChannel.push(new Float32Array(right))
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

  bufferSilenceCount = (channel) => {
    let min = 100
    let max = -100
    // let total = 0
    let count = 0
    for (let i = 0; i < channel.length; i += 1) {
      if (channel[i] > max) {
        max = channel[i]
      }
      if (channel[i] < min) {
        min = channel[i]
      }
      // total += channel[i]

      if (channel[i] > -0.001 && channel[i] < 0.001) {
        count += 1
      }
      /* else {
        channel[i] = channel[i] * 2;
        if (channel[i] > 1.0) {
          channel[i] = 1.0;
        }
        if (channel[i] < -1.0) {
        channel[i] = -1.0;
      }
    } */
    }
    // const avg = total / channel.length
    // console.log("Min: " + min + ", max: " + max + ", total: " + total + ", avg: " + avg);
    return count
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText })
  }

  onUpdateTranscript = (chapters) => {
    console.log('update')
    console.log(chapters)
    // this.setState({ chapters: this.state.originalChapters },()=>{
    // console.log('current chapters')
    //    })
  }

  onValidateTranscript = (errors) => {
    this.setState({ errors })
  }

  detectSilence = (lcX, rcX, numberOfAudioChannels) => {
    const { silentBuffersInRow } = this.state
    const lc = lcX[lcX.length - 1]
    let count = this.bufferSilenceCount(lc)
    let totalSize = lc.length

    if (numberOfAudioChannels === 2) {
      const rc = rcX[rcX.length - 1]
      count += this.bufferSilenceCount(rc)
      totalSize += rc.length
    }

    if (count / totalSize > 0.5) {
      this.setState({ silentBuffersInRow: silentBuffersInRow + 1 })
    } else {
      this.setState({ silentBuffersInRow: 0 })
    }
    // console.log("Silence detection: "
    // + count + "/" + totalSize + ", : "  + silentBuffersInRow);
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  render() {
    const {
      microphoneBeingPressed,
      originalChapters,
      keywords,
      tags
    } = this.state
    return (
      <Page title="Live Transcript">
        <EuiButton
          onClick={this.startRecord}
          style={microphoneBeingPressed === false ? { display: 'block' } : { display: 'none' }}
        >
          Start
        </EuiButton>
        <EuiButton
          onClick={this.stopRecord}
          style={microphoneBeingPressed === true ? { display: 'block' } : { display: 'none' }}
        >
          Stop
        </EuiButton>
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiFlexGroup wrap>
          <EuiFlexItem>
            <Editor
              originalChapters={originalChapters}
              keywords={keywords}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              validateTranscript={this.onValidateTranscript}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <Tags
              tags={tags}
              updateTags={this.onUpdateTags}
              ref={this.tagsRef}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}
