/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react'
import { EuiSpacer, EuiTextAlign, EuiProgress } from '@elastic/eui'
import mic from '../img/voice-recording.png'
import micRecording from '../img/voice-recording-red.png'
import '../styles/mic.css'

const Mic = ({
  recordingAction,
  microphoneBeingPressed,
  toggleRecord
}) => (
  <EuiTextAlign textAlign="center">
    <img
      src={mic}
      className="mic"
      style={microphoneBeingPressed === false ? { display: 'inline' } : { display: 'none' }}
      alt="mic"
      onClick={toggleRecord}
    />
    <span style={microphoneBeingPressed ? { display: 'inline' } : { display: 'none' }}>
      <img
        src={micRecording}
        className="micRecording"
        style={microphoneBeingPressed ? { display: 'inline' } : { display: 'none' }}
        alt="mic"
        onClick={toggleRecord}
      />
      <EuiSpacer size="m" />
      <EuiProgress size="s" color="subdued" />
    </span>
    <EuiSpacer size="m" />
    <span>
      Click the button to
      &nbsp;
      {recordingAction}
      &nbsp;
      recording
    </span>
  </EuiTextAlign>
)

export default Mic
