import React from 'react'
import PropTypes from 'prop-types'
import '../styles/record-list.css'

import { EuiTitle, EuiButton } from '@elastic/eui'

const  RecordList = ({audioClip}) => {
  console.log(audioClip)
  return ( audioClip && <section>
    <EuiTitle>
      <h5>Recorded clip</h5>
    </EuiTitle>
    <div className="container">
      <h6 className="title">{audioClip.name}</h6>
      <audio controls src={audioClip.src} className="audio-box"/>
      <EuiButton className="download-button">
        <a href={audioClip.src} download={audioClip.name}>Download</a>
      </EuiButton>
    </div>
  </section>)
}

RecordList.propTypes = {
  audioClip: PropTypes.object.isRequired
}

export default RecordList