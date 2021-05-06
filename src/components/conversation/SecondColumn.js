import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiFlexItem, 
  EuiFlexGroup
} from '@patronum/eui'
import io from 'socket.io-client'
import interpolateArray from '../../models/interpolateArray'
import * as recorder from '../../utils/recorder'
import NumberOfSpeakers from './NumberOfSpeakers'
const SecondColumn = ({
  item,
  numberOfSpeakers,
  updateNumberOfSpeakers,
  updateTranscription
}) => {
  const [audioContext, setAudioContext] = useState(null)
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false)
  const isPunctuationEnabled = false
  const [isRecording, setIsRecording] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const socketio = io.connect('wss://ilxgpu1000.inoviaai.se/audio', {
    path: '/api/v1/sweden',
    transports: ['websocket']
  })

  const connectAudioInput = async (audioContext) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const inputPoint = audioContext.createGain()
    // Create an AudioNode from the stream.
    const realAudioInput = await audioContext.createMediaStreamSource(stream)
    let audioInput = realAudioInput
    audioInput = convertToMono(audioInput, audioContext)
    audioInput.connect(inputPoint)

    const { createScriptProcessor, createJavaScriptNode } = audioContext
    const scriptNode = (createScriptProcessor || createJavaScriptNode).call(
      audioContext,
      16384,
      1,
      1
    )

    scriptNode.onaudioprocess = (audioEvent) => {
      if (isRecording) return
      setRecordedTime(Math.ceil(audioContext.currentTime))

      const inputBuffer = audioEvent.inputBuffer.getChannelData(0)
      const input = interpolateArray(
        inputBuffer,
        16000,
        audioContext.sampleRate
      )
      const output = new DataView(new ArrayBuffer(input.length * 2)) 
      // length is in bytes (8-bit), so *2 to get 16-bit length
      for (var i = 0, offset = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]))
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      }
      recorder.record([input])
      socketio.emit('write-audio', Buffer.from(output.buffer))
    }
    inputPoint.connect(scriptNode)
    scriptNode.connect(audioContext.destination)
    const zeroGain = audioContext.createGain()
    zeroGain.gain.value = 0.0
    inputPoint.connect(zeroGain)
    zeroGain.connect(audioContext.destination)
  }

  const convertToMono = (input, audioContext) => {
    var splitter = audioContext.createChannelSplitter(2)
    var merger = audioContext.createChannelMerger(2)
    input.connect(splitter)
    splitter.connect(merger, 0, 0)
    splitter.connect(merger, 0, 1)
    return merger
  }

  const toggleRecording = async () => {
    let newAudioContext
    if (!isRecording) {
      setIsRecording(true)
      newAudioContext = new window.AudioContext()
      if (audioContext === null) {
        setAudioContext(newAudioContext)
      } else {
        newAudioContext = audioContext
      }
      socketio.emit('start-recording', {
        enablePunctuation: isPunctuationEnabled,
        numChannels: 1,
        bps: 16,
        fps: parseInt(newAudioContext.sampleRate),
        number_of_speakers: numberOfSpeakers
      })
      if (newAudioContext.state === 'suspended' && recordedTime !== 0) {
        newAudioContext.resume()
      } else {
        await connectAudioInput(newAudioContext)
      }
      recorder.start()
      socketio.on('add-transcript', (text) => {
        // eslint-disable-next-line no-console
        // console.log(text)
        updateTranscription(text)
      })
    } else {
      socketio.emit('end-recording')
      setIsRecording(false)
      audioContext.suspend()
    }
  }

  const openFlyout = () => {
    setIsFlyoutOpen(true)
  }
  const closeFlyout = () => {
    setIsFlyoutOpen(false)
  }

  const beginTheRecording = () => {
    setIsFlyoutOpen(false)
    toggleRecording()
  }

  return item === '+New live recording' ? (
    <>
      <EuiButtonEmpty onClick={openFlyout} disabled={isRecording}>
        +New live recording
      </EuiButtonEmpty>
      {isFlyoutOpen && (
        <EuiFlyout
          ownFocus
          style={{ width: '87vw' }}
          onClose={() => closeFlyout()}
          aria-labelledby="flyoutTitle"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2 id="flyoutTitle">New Live Recording</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiSpacer size="l" />
            <EuiFlexGroup direction="unset">
              <NumberOfSpeakers
                updateNumberOfSpeakers={updateNumberOfSpeakers}
              />
            </EuiFlexGroup>
            <EuiSpacer size="l" />
            <EuiFlexGroup direction="column">
              <EuiFlexItem>
                <EuiButton
                  size="m"
                  fill
                  style={{ width: '200px', color: '#041587' }}
                  onClick={beginTheRecording}
                >
                  Start Live Recording
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  ) : (
    <EuiButtonEmpty>
      <span>Telefon</span>
    </EuiButtonEmpty>
  )
}

SecondColumn.propTypes = {
  item: PropTypes.string.isRequired,
  numberOfSpeakers: PropTypes.number.isRequired,
  updateNumberOfSpeakers: PropTypes.func.isRequired,
  updateTranscription: PropTypes.func.isRequired  
}

SecondColumn.propTypes = {
  item: PropTypes.string.isRequired,
  numberOfSpeakers: PropTypes.number.isRequired,
  updateNumberOfSpeakers: PropTypes.func.isRequired,
  updateTranscription: PropTypes.func.isRequired  
}

SecondColumn.propTypes = {
  item: PropTypes.string.isRequired,
  numberOfSpeakers: PropTypes.number.isRequired,
  updateNumberOfSpeakers: PropTypes.func.isRequired,
  updateTranscription: PropTypes.func.isRequired  
}

SecondColumn.propTypes = {
  item: PropTypes.string.isRequired,
  numberOfSpeakers: PropTypes.number.isRequired,
  updateNumberOfSpeakers: PropTypes.func.isRequired,
  updateTranscription: PropTypes.func.isRequired  
}

export default SecondColumn
