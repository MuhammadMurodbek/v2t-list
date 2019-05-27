/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react'
import { EuiSpacer, EuiTextAlign } from '@elastic/eui'
import mic from '../img/voice-recording.png'
import micRecording from '../img/voice-recording-red.png'

const Mic = ({ recordingAction, microphoneBeingPressed, toggleRecord }) => (
  <EuiTextAlign textAlign="left">
    <img
      src={mic}
      className="mic"
      style={microphoneBeingPressed === false ? {
        display: 'block', color: 'black', height: '50px', cursor: 'pointer'
      } : { display: 'none' }}
      alt="mic"
      onClick={toggleRecord}
    />
    <img
      src={micRecording}
      className="mic"
      style={microphoneBeingPressed === true ? {
        display: 'block', color: 'black', height: '50px', cursor: 'pointer'
      } : { display: 'none' }}
      alt="mic"
      onClick={toggleRecord}
    />
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
