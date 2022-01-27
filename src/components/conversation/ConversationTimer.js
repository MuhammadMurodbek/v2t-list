import React from 'react'
import PropTypes from 'prop-types'
import { EuiText } from '@inoviaab/eui'


const ConversationTimer = ({ time }) => {
  const textProperties = {
    color: 'white',
    marginTop: 4,
    fontSize: 25,
    right:0
  }
  const divProperties = {
    position: 'absolute',
    marginLeft: 602
  }
  
  return (
    <div style={divProperties}>
      <EuiText>
        <p style={textProperties}>{time}</p>
      </EuiText>
    </div>
  )
}

ConversationTimer.propTypes = {
  time: PropTypes.string
}

export default ConversationTimer
