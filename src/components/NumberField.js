import { 
  EuiFieldNumber, 
  EuiFlexGroup, 
  EuiFlexItem, 
  EuiToolTip,
  EuiButtonIcon } from '@elastic/eui'
import React from 'react'
import PropTypes from 'prop-types'

const NumberField = ({ 
  chapters, 
  chapterId, 
  segments, 
  updateTranscript,
  createNewSectionAfterThis,
  isTranscriptStateRevoked
}) => {
  const [value, setValue] = React.useState(
    segments.length > 0 ?
      segments.map((segment) => segment.words)
      .join(' ')
      .replace(',','.') // Handle comma as a decimal
      .trim()
    : ''
  )
  const updateNumberField = (letter) => {
    const updatedChapters = chapters.map((chapter, i) => {
      if (chapterId !== i) {
        return chapter
      } else {
        let updatedSegments = []
        if (chapter.segments.length > 0) {
          updatedSegments = [
            {
              words: letter, 
              startTime: chapter.segments[0].startTime, 
              endTime: chapter.segments[chapter.segments.length-1].endTime
            }
          ]
          return { ...chapter, segments: updatedSegments }
        } else {
          updatedSegments = [
            { 
              words: letter,
              startTime: 0,
              endTime: 0
            }
          ]
          return { ...chapter, segments: updatedSegments }
        }
      }
    })
    setValue(letter)
    updateTranscript(updatedChapters, true)
  }

  const deleteNumberField = (chapterId) => {
    const updatedChapters = [...chapters]
    updatedChapters.splice(chapterId, 1)
    updateTranscript(updatedChapters, true)
  }

  return (
    <EuiFlexGroup style={{ alignItems: 'center', width: 400 }}>
      <EuiFlexItem>
        <EuiFieldNumber
          disabled={isTranscriptStateRevoked}
          value={value}
          onChange={(e) => updateNumberField(e.target.value)}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiToolTip position="top" content="Remove this section">
          <EuiButtonIcon
            aria-label="remove"
            color="danger"
            display="base"
            size="m"
            iconType="trash"
            onClick={() => deleteNumberField(chapterId)}
            disabled={isTranscriptStateRevoked}
          />
        </EuiToolTip>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiToolTip position="top" content="Add a new section">
          <EuiButtonIcon
            aria-label="add"
            display="base"
            size="m"
            iconType="plusInCircle"
            onClick={() => createNewSectionAfterThis(chapterId)}
            disabled={isTranscriptStateRevoked}
          />
        </EuiToolTip>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}

NumberField.propTypes = {
  chapters: PropTypes.array.isRequired,
  chapterId: PropTypes.number,
  segments: PropTypes.array,
  updateTranscript: PropTypes.func.isRequired,
  createNewSectionAfterThis: PropTypes.func.isRequired,
  isTranscriptStateRevoked: PropTypes.bool
}


export default NumberField