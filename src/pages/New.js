/* eslint-disable no-console */
/* eslint-disable no-alert */
import React, { useState, useEffect, useRef } from 'react'
import { EuiButton } from '@elastic/eui'
import Page from '../components/Page'

const NewPage = () => {
  const [numberOfAudioChannels] = useState(2)
  const [microphoneBeingPressed, setMicrophoneBeingPressed] = useState(false)
  const jsAudioNode = useRef(null)
  const audioInput = useRef(null)
  const leftChannel = useRef([])
  const rightChannel = useRef([])
  const chunkLeftChannel = useRef([])
  const chunkRightChannel = useRef([])
  const recordingLength = useRef(0)
  const chunkRecordingLength = useRef(0)
  const bufferSize = useRef(4096)
  const sampleRate = useState(44100)
  const [chunkStartTime, setChunkStartTime] = useState(new Date().getTime())
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    console.log('hola')
  })

  const onAudioProcess = (e) => {
    const left = e.inputBuffer.getChannelData(0)
    const tempLeftChannel = leftChannel.current
    // console.log(leftChannel)
    tempLeftChannel.push(new Float32Array(left))
    leftChannel.current.push(tempLeftChannel)

    const tempChunkLeftChannel = chunkLeftChannel.current
    tempChunkLeftChannel.push(new Float32Array(left))
    chunkLeftChannel.current.push(tempChunkLeftChannel)

    const right = e.inputBuffer.getChannelData(1)
    const tempRightChannel = rightChannel.current
    tempRightChannel.push(new Float32Array(right))
    rightChannel.current.push(tempRightChannel)

    const tempChunkRightChannel = chunkRightChannel.current
    tempChunkRightChannel.push(new Float32Array(right))
    chunkRightChannel.current.push(tempChunkRightChannel)
    console.log('chunkRecordingLength.current')
    console.log(chunkRecordingLength.current)
    console.log('bufferSize')
    console.log(bufferSize.current)
    recordingLength.current += bufferSize.current
    chunkRecordingLength.current += bufferSize.current
  }

  const startRecord = () => {
    console.log('Checking Audio Device Status')
    setMicrophoneBeingPressed(true)
    const Storage = {}
    Storage.ctx = new AudioContext()
    if (Storage.ctx.createJavaScriptNode) {
      jsAudioNode.current = Storage.ctx.createJavaScriptNode(
        bufferSize, numberOfAudioChannels, numberOfAudioChannels
      )
      if (jsAudioNode.current) {
        jsAudioNode.current.connect(Storage.ctx.destination)
      }
    } else if (Storage.ctx.createScriptProcessor) {
      jsAudioNode.current = Storage.ctx.createScriptProcessor(
        bufferSize, numberOfAudioChannels, numberOfAudioChannels
      )
      if (jsAudioNode.current) {
        jsAudioNode.current.connect(Storage.ctx.destination)
      }
    } else {
      alert('WebAudio API has no support on this browser.')
    }
    setChunkStartTime(new Date().getTime())
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((microphone) => {
        audioInput.current = Storage.ctx.createMediaStreamSource(microphone)
        audioInput.current.connect(jsAudioNode.current)
        setRecording(true)
        console.log('recording')
        jsAudioNode.current.onaudioprocess = onAudioProcess
      }).catch((err) => {
        console.log(err)
        alert('Input Device not recognized')
      })
  }

  const mergeBuffers = (channelBuffer, rLength, opt) => {
    console.log('in the callback ....')
    console.log(opt)
    console.log('channel buffer')
    console.log(channelBuffer)
    console.log('channel buffer length')
    console.log(channelBuffer.length)
    console.log('rLength')
    console.log(rLength)
    console.log('channel buffer')
    console.log(channelBuffer )
    const result = new Float64Array(rLength)
    let offset = 0
    const lng = channelBuffer.length
    console.log('lng ::'+lng)
    for (let i = 0; i < lng; i += 1) {
      console.log(i)
      const buffer = channelBuffer[i]
      console.log('Buffer')
      console.log(channelBuffer[i])
      result.set(buffer, offset)
      offset += buffer.length
      console.log('we are here '+i)
    }
    console.log('all is blueß')
    return result
  }

  const linearInterpolate = (before, after, atPoint) => {
    return before + (after - before) * atPoint
  }

  // for changing the sampling rate, reference:
  // http://stackoverflow.com/a/28977136/552182
  const interpolateArray = (data, newSampleRate, oldSampleRate) => {
    const fitCount = Math.round(data.length * (newSampleRate / oldSampleRate))
    const newData = []
    const springFactor = Number((data.length - 1) / (fitCount - 1))
    newData[0] = data[0] // for new allocation
    for (let i = 1; i < fitCount - 1; i += 1) {
      const tmp = i * springFactor
      const before = Number(Math.floor(tmp)).toFixed()
      const after = Number(Math.ceil(tmp)).toFixed()
      const atPoint = tmp - before
      newData[i] = linearInterpolate(data[before], data[after], atPoint)
    }
    newData[fitCount - 1] = data[data.length - 1] // for new allocation
    return newData
  }

  const writeUTFBytes = (view, offset, string) => {
    const lng = string.length
    for (let i = 0; i < lng; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const interleave = (leftChannel, rightChannel) => {
    const length = leftChannel.length + rightChannel.length
    const result = new Float64Array(length)
    let inputIndex = 0

    for (let index = 0; index < length;) {
      result[index++] = leftChannel[inputIndex]
      result[index++] = rightChannel[inputIndex]
      inputIndex++
    }
    return result
  }

  const mergeLeftRightBuffers = (config, callback) => {
    console.log('current')
    console.log(config)
    let leftBuffers = config.leftBuffers.slice(0)
    let rightBuffers = config.rightBuffers.slice(0)
    // let sampleRate = config.sampleRate
    let sampleRate = config.sampleRate[0]
    let internalInterleavedLength = config.internalInterleavedLength
    let desiredSampRate = config.desiredSampRate

    if (numberOfAudioChannels === 2) {
      leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength,'l')
      rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength,'r')
      if (desiredSampRate) {
        leftBuffers = interpolateArray(leftBuffers, desiredSampRate, sampleRate)
        rightBuffers = interpolateArray(rightBuffers, desiredSampRate, sampleRate)
      }
    }

    if (numberOfAudioChannels === 1) {
      leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength,'m')
      if (desiredSampRate) {
        leftBuffers = interpolateArray(leftBuffers, desiredSampRate, sampleRate)
      }
    }

    // set sample rate as desired sample rate
    if (desiredSampRate) {
      sampleRate = desiredSampRate
    }
    let interleaved

    if (numberOfAudioChannels === 2) {
      interleaved = interleave(leftBuffers, rightBuffers)
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
    writeUTFBytes(view, 0, 'RIFF')

    // RIFF chunk length
    view.setUint32(4, 44 + interleavedLength * 2, true);

    // RIFF type
    writeUTFBytes(view, 8, 'WAVE')

    // format chunk identifier
    // FMT sub-chunk
    writeUTFBytes(view, 12, 'fmt ')

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
    writeUTFBytes(view, 36, 'data')

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
    callback(
      buffer,
      view,
    )
  }

  const mergeCallbackChunk = (buffer, view) => {
    console.log('in the callback for chunk')
    const blob = new Blob([view], { type: 'audio/wav' })
    const a = document.createElement('a')
    document.body.appendChild(a)
    // a.style = 'display: none'


    // download blob
    let url = window.URL.createObjectURL(blob)
    a.href = url;
    a.download = "a.wav"
    a.click(()=>{
      console.log('downloading audio data')
      return true
    })
    window.URL.revokeObjectURL(url)

    setChunkStartTime(new Date().getTime())
    leftChannel.current = []
    rightChannel.current = []
    chunkLeftChannel.current = []
    chunkRightChannel.current = []
    recordingLength.current = 0
    chunkRecordingLength.current = 0
    this.sendRequest(blob)
  }


  const stopRecord = () => {
    setMicrophoneBeingPressed(false)
    audioInput.current.disconnect()
    jsAudioNode.current.disconnect()
    mergeLeftRightBuffers({
      sampleRate,
      desiredSampRate: 16000,
      numberOfAudioChannels,
      internalInterleavedLength: chunkRecordingLength.current,
      leftBuffers: chunkLeftChannel.current,
      rightBuffers: numberOfAudioChannels === 1 ? [] : chunkRightChannel.current
    }, mergeCallbackChunk)
  }


  return (
    <Page title="Start a Transcript">
      <EuiButton 
        onClick={startRecord}
        style={microphoneBeingPressed === false ? { display: 'block' } : { display: 'none' }}
      > Start </EuiButton>
      <EuiButton 
        onClick={stopRecord}
        style={microphoneBeingPressed === true ? { display: 'block' } : { display: 'none' }}
      > Stop </EuiButton>
    </Page>
  )
}

export default NewPage
