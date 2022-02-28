import { 
  EuiDatePicker, 
  EuiFlexGroup, 
  EuiFlexItem, 
  EuiToolTip, 
  EuiButtonIcon 
} from '@elastic/eui'
import React, { useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'

const DatePickerField = ({ 
  chapters, 
  chapterId, 
  updateTranscript,
  createNewSectionAfterThis
}) => {
  React.useEffect(() => {
    const updatedChapters = chapters.map((chapter, i) => {
      if (chapterId !== i) {
        return chapter
      } else {
        let updatedSegments = []
        if (chapter.segments.length > 0) {
          updatedSegments = [
            {
              words: moment().format('YYYY-MM-DD'), 
              startTime: chapter.segments[0].startTime, 
              endTime: chapter.segments[chapter.segments.length-1].endTime
            }
          ]
          return { ...chapter, segments: updatedSegments }
        } else {
          updatedSegments = [
            { 
              words: moment().format('YYYY-MM-DD'),
              startTime: 0,
              endTime: 0
            }
          ]
          return { ...chapter, segments: updatedSegments }
        }
      }
    })
    updateTranscript(updatedChapters, true)
  }, [])
  const [startDate, setStartDate] = useState(moment())
  const handleChange = (date) => {
    const updatedChapters = chapters.map((chapter, i) => {
      if (chapterId !== i) {
        return chapter
      } else {
        let updatedSegments = []
        if (chapter.segments.length > 0) {
          updatedSegments = [
            {
              words: moment(date).format('YYYY-MM-DD'), 
              startTime: chapter.segments[0].startTime, 
              endTime: chapter.segments[chapter.segments.length-1].endTime
            }
          ]
          return { ...chapter, segments: updatedSegments }
        } else {
          updatedSegments = [
            { 
              words: moment(date).format('YYYY-MM-DD'),
              startTime: 0,
              endTime: 0
            }
          ]
          return { ...chapter, segments: updatedSegments }
        }
      }
    })
    setStartDate(moment(date))
    updateTranscript(updatedChapters, true)
  }

  const deleteDateField = (chapterId) => {
    const updatedChapters = [...chapters]
    updatedChapters.splice(chapterId, 1)
    updateTranscript(updatedChapters, true)
  }

  return (
    <EuiFlexGroup style={{ alignItems: 'center', width: 400 }}>
      <EuiFlexItem>
        <EuiDatePicker selected={startDate} onChange={handleChange} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiToolTip position="top" content="Remove this section">
          <EuiButtonIcon
            aria-label="remove"
            color="danger"
            display="base"
            size="m"
            iconType="trash"
            onClick={() => deleteDateField(chapterId)}
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
          />
        </EuiToolTip>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}

DatePickerField.propTypes = {
  chapters: PropTypes.array.isRequired,
  chapterId: PropTypes.number,
  updateTranscript: PropTypes.func.isRequired,
  createNewSectionAfterThis: PropTypes.func.isRequired
}

export default DatePickerField