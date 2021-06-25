/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import EditableChapter from '../components/EditableChapter'

const EditableChapters = ({
  recordingChapter,
  chapters,
  inputRef,
  complicatedFieldOptions,
  updateComplicatedFields,
  ...editableChapterProps
}) => {
  if (!inputRef) return null
  const editors = chapters.map((chapter, i) => {
    return (
      <EditableChapter
        key={i}
        chapterId={i}
        keyword={chapter.keyword}
        segments={chapter.segments}
        recordingChapter={recordingChapter}
        complicatedFieldOptions={complicatedFieldOptions}
        updateComplicatedFields={updateComplicatedFields}
        {...{ ...editableChapterProps }}
      />
    )
  })
  return <div ref={inputRef}>{editors}</div>
}

EditableChapters.propTypes = {
  chapters: PropTypes.array.isRequired,
  inputRef: PropTypes.any
}

export default EditableChapters