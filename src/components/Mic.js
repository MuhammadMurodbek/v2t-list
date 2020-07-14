/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react'
import { EuiSpacer, EuiTextAlign, EuiI18n } from '@patronum/eui'
import mic from '../img/voice-recording.png'
import micRecording from '../img/voice-recording-red.png'
import '../styles/mic.css'
import formattedTime from '../models/live/formattedTime'

const Mic = ({ microphoneBeingPressed, toggleRecord, seconds }) => (
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
      className="micRecording"
      style={
        microphoneBeingPressed ? { display: 'inline' } : { display: 'none' }
      }
      alt="mic"
      onClick={toggleRecord}
    />
    {/* <EuiProgress size="s" color="subdued" /> */}

    <EuiSpacer size="s" />
    <span
      style={{
        display: microphoneBeingPressed ? 'inline' : 'none',
        fontSize: 20
      }}
    >
      {formattedTime(seconds)}
    </span>
    <span
      style={{
        display: microphoneBeingPressed ? 'none' : 'inline',
        fontSize: 20
      }}
    >
      <EuiI18n toke="startDictation" default="Start Dictation" />
    </span>
  </EuiTextAlign>
)

export default Mic
