import React from 'react'
import PropTypes from 'prop-types'
import '../styles/record-list.css'

import { EuiTitle } from '@patronum/eui'

const  RecordList = ({audioClip}) => {
  return ( audioClip && <section>
    <EuiTitle>
      <h5>Recorded clip</h5>
    </EuiTitle>
    <div className="container">
      <h6 className="title">{audioClip.name}</h6>
      <audio controls src={audioClip.src} className="audio-box" controlsList="nodownload"/>
    </div>
  </section>)
}

RecordList.propTypes = {
  audioClip: PropTypes.object.isRequired
}

export default RecordList