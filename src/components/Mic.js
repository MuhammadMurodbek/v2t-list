/* eslint-disable react/prop-types */
import React from 'react'
import { EuiTextAlign } from '@elastic/eui'
import mic from '../img/voice-recording.png'
import micRecording from '../img/voice-recording-red.png'
import '../styles/mic.css'

const Mic = ({ visible, microphoneBeingPressed, toggleRecord }) => {
  if (!visible) return null
  return (
    <EuiTextAlign textAlign="center" style={{ zIndex: 10 }}>
      <img
        src={mic}
        className="mic"
        style={
          microphoneBeingPressed === false
            ? { display: 'inline' }
            : { display: 'none' }
        }
        alt="mic"
        onClick={toggleRecord}
      />

      <img
        src={micRecording}
        className="mic recording"
        style={
          microphoneBeingPressed ? { display: 'inline' } : { display: 'none' }
        }
        alt="mic"
        onClick={toggleRecord}
      />
    </EuiTextAlign>
  )
}

export default Mic
