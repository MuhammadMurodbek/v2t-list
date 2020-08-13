/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react'
import { EuiTextAlign } from '@patronum/eui'
import mic from '../img/voice-recording.png'
import micRecording from '../img/voice-recording-red.png'
import '../styles/mic.css'

const Mic = ({ visible, microphoneBeingPressed, toggleRecord, seconds, isSessionStarted }) => {
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
