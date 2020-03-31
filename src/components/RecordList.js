import React from 'react'
import PropTypes from 'prop-types'
import '../styles/record-list.css'

import { EuiTitle, EuiButton } from '@elastic/eui'

const  RecordList = ({audioClips}) => {
  return (
    <section>
      { audioClips.length > 0 ?
        <EuiTitle>
          <h5>Recorded clips</h5>
        </EuiTitle> : null
      }
      { audioClips.map((clip, i) => {
        return (
          <div className="container" key={i}>
            <h6 className="title">{clip.name}</h6>
            <audio controls src={clip.src} className="audio-box"/>
            <EuiButton className="download-button">
              <a href={clip.src} download={clip.name}>Download</a>
            </EuiButton>
          </div>
        )
      })}
    </section>
  )
}

RecordList.propTypes = {
  audioClips: PropTypes.array.isRequired
}

export default RecordList