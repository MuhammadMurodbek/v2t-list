/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import { EuiText } from '@patronum/eui'
import PropTypes from 'prop-types'
import Chunk from '../components/Chunk'

const Chunks = ({
  recordingChapter,
  segments,
  currentTime,
  context,
  chapterId,
  onChange,
  onPaste,
  onKeyDown,
  onSelect,
  onCursorChange
}) => {
  if (recordingChapter !== null)
    return (
      <ReadOnlyChunks {...{ recordingChapter, chapterId, segments, context }} />
    )
  const chunks = segments.map((props, i) => (
    <Chunk key={i} {...{ ...props, chapterId, i, currentTime, context }} />
  ))
  return (
    <EuiText>
      <pre>
        <code
          className="editorTextArea"
          key={JSON.stringify(segments)}
          onInput={(e) => onChange(e, chapterId)}
          onPaste={(e) => onPaste(e, chapterId)}
          onKeyDown={(e) => onKeyDown(e, chapterId)}
          onKeyUp={onCursorChange}
          onClick={onCursorChange}
          onSelect={onSelect}
          contentEditable
          suppressContentEditableWarning
          data-chapter={chapterId}
        >
          {chunks.length ? chunks : <FallbackChunk chapterId={chapterId} />}
        </code>
      </pre>
    </EuiText>
  )
}

const ReadOnlyChunks = ({ context, segments, chapterId, recordingChapter }) => (
  <EuiText>
    <pre>
      <code
        className={`editorTextArea${
          chapterId === recordingChapter ? ' active' : ''
        }`}
        data-chapter={chapterId}
      >
        <span
          style={{ fontSize: context.currentFontSize }}
          className="editorBody"
        >
          {segments.map(({ words }) => words).join(' ')}
        </span>
      </code>
    </pre>
  </EuiText>
)

const FallbackChunk = ({ chapterId }) => (
  <Chunk
    words=""
    startTime={0}
    endTime={0}
    chapterId={chapterId}
    i={0}
    currentTime={0}
  />
)

FallbackChunk.propTypes = {
  chapterId: PropTypes.number
}


Chunks.propTypes = {
  segments: PropTypes.array,
  currentTime: PropTypes.number,
  context: PropTypes.object,
  chapterId: PropTypes.number,
  onChange: PropTypes.func,
  onPaste: PropTypes.func,
  onKeyDown: PropTypes.func,
  onSelect: PropTypes.func,
  onCursorChange: PropTypes.func
}

export default Chunks