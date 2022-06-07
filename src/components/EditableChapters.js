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
  singleSelectFieldOptions,
  updateComplicatedFields,
  deleteComplicatedField,
  isTranscriptStateRevoked,
  ...editableChapterProps
}) => {
  if (!inputRef) return null
  const editors = chapters.map((chapter, i) => {
    return (
      <EditableChapter
        key={`${chapter.keyword}_${i}`}
        chapterId={i}
        id={chapter.id}
        keyword={chapter.keyword}
        segments={chapter.segments}
        multiSelectOptionValues={chapter.values}
        recordingChapter={recordingChapter}
        complicatedFieldOptions={complicatedFieldOptions}
        singleSelectFieldOptions={singleSelectFieldOptions}
        updateComplicatedFields={updateComplicatedFields}
        deleteComplicatedField={deleteComplicatedField}
        chapters={chapters}
        isTranscriptStateRevoked={isTranscriptStateRevoked}
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

export default React.memo(EditableChapters)