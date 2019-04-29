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
  const [chunkStartTime, setChunkStartTime] = useState(new Date().getTime())
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    console.log('hola')
  })

  const checkTheAudio = () => {
    console.log('Checking Audio Device Status')
    setMicrophoneBeingPressed(true)
    const Storage = {}
    Storage.ctx = new AudioContext()
    const bufferSize = 4096
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
        // jsAudioNode.current.onaudioprocess = onAudioProcess
      }).catch((err) => {
        console.log(err)
        alert('Input Device not recognized')
      })
  }

  return (
    <Page title="Start a Transcript">
      {/* <button onClick={checkTheAudio}>hello</button> */}
      <EuiButton onClick={checkTheAudio}> Check The Audio </EuiButton>
    </Page>
  )
}

export default NewPage
