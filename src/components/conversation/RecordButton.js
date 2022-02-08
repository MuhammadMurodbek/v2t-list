import React from 'react'
import PropTypes from 'prop-types'
import { EuiIcon } from '@elastic/eui'
import mic from '../../img/mic.svg'

const RecordButton = ({ isRecording }) => {
  const divProperties = {
    backgroundColor: isRecording ? 'red' : '#041587',
    marginLeft: 5,
    borderRadius: 5,
    paddingTop: 15,
    paddingLeft: 10,
    paddingRight: 10,
    cursor: 'pointer'
  }

  return (
    <div style={divProperties}>
      <EuiIcon type={mic} size="xl" title="Custom SVG icon" />
    </div>
  )
}

RecordButton.propTypes = {
  isRecording: PropTypes.bool
}

export default RecordButton
