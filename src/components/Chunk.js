/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'

const Chunk = ({
  words,
  startTime,
  endTime,
  chapterId,
  i,
  currentTime,
  context,
  isMedicalAssistantEnabled,
  isThisChunkHighlighted
}) => {
  if (isMedicalAssistantEnabled) {
    let style
    if (context) {
      style = isThisChunkHighlighted ? {
        fontWeight: 'bold',
        backgroundColor: 'pink',
        fontSize: context.currentFontSize
      } : { fontSize: context.currentFontSize }
    } else {
      style = isThisChunkHighlighted ? { fontWeight: 'bold', backgroundColor: 'pink' } : {}
    }
    return (
      <span style={style} className="editorBody" data-chapter={chapterId} data-segment={i}>
        {words}
      </span>
    )
  } else {
    let style
    const current = currentTime > startTime && currentTime <= endTime
    if (context) {
      style = current
        ? {
          fontWeight: 'bold',
          backgroundColor: '#FFFF00',
          fontSize: context.currentFontSize
        } : { fontSize: context.currentFontSize }
    } else {
      style = current ? { fontWeight: 'bold', backgroundColor: '#FFFF00' } : {}
    }
    return (
      <span
        style={style}
        className="editorBody"
        data-chapter={chapterId}
        data-segment={i}
      >
        {words}
      </span>
    )
  }
}

Chunk.propTypes = {
  words: PropTypes.any,
  startTime: PropTypes.number,
  endTime: PropTypes.number,
  chapterId: PropTypes.number,
  i: PropTypes.number,
  currentTime: PropTypes.number,
  context: PropTypes.object
}

export default Chunk