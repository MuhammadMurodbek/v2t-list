import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import '../../styles/conversation-player.css'

const Timeline = ({
  lengthOfAudioInSeconds = 0,
  updateCurrentTime,
  currentTime,
  audioRef
}) => {
  const [value, setValue] = useState(currentTime || '0')
  const onChangeCurrentTime = (e) => {
    updateCurrentTime(e.target.value)
    audioRef.current.currentTime = e.target.value
  }

  useEffect(() => {
    setValue(currentTime)
  }, [currentTime])
 
  return (
    <div style={{ position: 'fixed' }}>
      <div className="range-slider">
        <input
          className="input-range"
          orient="vertical"
          type="range"
          value={value}
          min="0"
          max={lengthOfAudioInSeconds.toString()}
          onChange={onChangeCurrentTime}
        />
        <span className="range-value"></span>
      </div>
    </div>
  )
}

Timeline.propTypes = {
  lengthOfAudioInSeconds: PropTypes.number,
  updateCurrentTime: PropTypes.func,
  currentTime: PropTypes.string.isRequired,
  audioRef: PropTypes.object.isRequired
}

export default Timeline
