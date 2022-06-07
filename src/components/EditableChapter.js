/* eslint-disable no-console */
import React from 'react'
import { EuiFormRow } from '@elastic/eui'
import SectionHeader from '../components/SectionHeader'
import PropTypes from 'prop-types'
import Chunks from '../components/Chunks'
import ComplicatedField from './ComplicatedField'
import NumberField from './NumberField'
import DatePickerField from './DatePickerField'

const EditableChapter = ({
  recordingChapter,
  chapterId,
  keyword,
  schema,
  setKeyword,
  segments,
  complicatedFieldOptions,
  singleSelectFieldOptions,
  updateComplicatedFields,
  deleteComplicatedField,
  createNewSectionAfterThis,
  // eslint-disable-next-line react/prop-types
  multiSelectOptionValues,
  chapters,
  updateTranscript,
  isTranscriptStateRevoked,
  ...chunkProps
}) => {
  const { fields } = schema
  const sectionHeaders = fields
    ? fields.map(({ name }) => name)
    : []

  const field = fields.find(({ id }) => id === keyword)
    ?? { name: '', visible: true }

  const { name, type = {}, visible, headerPatterns = []} = field
  
  const sectionHeader = name
  const isMultiSelectEnabled = type.select?.multiple
  const isSingleSelectEnabled = !type.select?.multiple && type.select?.options
  const isComplicatedSelect = type.select?.multiple && type.select?.options
  const isNumberField = type.number && true
  const isDateField = type.date && true

  let filteredSegments = segments 
  if (/live-diktering/.test(window.location.href)) {
    const namePatterns = field
      ? [name, ...(headerPatterns || [])]
      : []
    const escapedNamePatterns = namePatterns.map(escapeRegularExpression)
    const regex = new RegExp(`^(${escapedNamePatterns.join(' |')} )?(.?)`, 'i')
    filteredSegments = segments.map((segment, i) => {
      const words =
      i === 0
        ? segment.words.replace(regex, (...match) => {
          const hideChars = match[1] ? match[1] : ''
          return `${'\u200c'.repeat(
            hideChars.length
          )}${match[2].toUpperCase()}`
        })
        : segment.words
      return { ...segment, words }
    })
  }
  const joinedSegments = segments.map((segment) => segment.words).join('')
  const selectedChoice = (type.select?.options || []).filter(
    (ch) =>
      ch.toLowerCase().trim() === joinedSegments.toLowerCase().trim()
  )


  const getComplicatedFieldProps = (props) => {
    return {
      complicatedFieldOptions,
      updateComplicatedFields,
      sectionHeader,
      chapterId,
      createNewSectionAfterThis,
      deleteComplicatedField,
      id: chunkProps.id,
      isSingleSelectEnabled,
      isTranscriptStateRevoked,
      ...props
    }
  }
  return (
    <EuiFormRow
      style={{
        maxWidth: '100%',
        display: visible ? 'default' : 'none'
      }}
    >
      <>
        <SectionHeader
          keywords={sectionHeaders}
          selectedHeader={sectionHeader}
          updateKey={setKeyword}
          chapterId={chapterId}
          chapters={chapters}
          isComplicatedSelect={isComplicatedSelect}
        />
        {(isMultiSelectEnabled && complicatedFieldOptions[sectionHeader]) && (
          <>
            <ComplicatedField
              {...getComplicatedFieldProps(
                { selectedChoice: multiSelectOptionValues || []}
              )}
            />
          </>
        )}
        {(isSingleSelectEnabled &&
            singleSelectFieldOptions[sectionHeader]) && (
          <>
            <ComplicatedField
              {...getComplicatedFieldProps({
                selectedChoice,
                complicatedFieldOptions: singleSelectFieldOptions
              })}
            />
          </>
        )}
        {isNumberField && 
        <NumberField 
          chapters={chapters}
          chapterId={chapterId} 
          segments={segments}
          updateTranscript={updateTranscript}
          createNewSectionAfterThis={createNewSectionAfterThis}
          isTranscriptStateRevoked={isTranscriptStateRevoked}
        />}
        {isDateField && <DatePickerField
          chapters={chapters}
          chapterId={chapterId} 
          updateTranscript={updateTranscript}
          createNewSectionAfterThis={createNewSectionAfterThis}
          isTranscriptStateRevoked={isTranscriptStateRevoked}
        />}
        {!isSingleSelectEnabled && !isMultiSelectEnabled 
          && !isNumberField && !isDateField && (
          <Chunks
            recordingChapter={recordingChapter}
            chapterId={chapterId}
            segments={filteredSegments}
            isTranscriptStateRevoked={isTranscriptStateRevoked}
            {...{ ...chunkProps }}
          />
        )}
      </>
    </EuiFormRow>
  )
}
const escapeRegularExpression = (string) => string
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // $& means the whole matched string

EditableChapter.propTypes = {
  recordingChapter: PropTypes.array,
  chapterId: PropTypes.number,
  keyword: PropTypes.string,
  schema: PropTypes.object.isRequired,
  setKeyword: PropTypes.func.isRequired,
  segments: PropTypes.array,
  complicatedFieldOptions: PropTypes.object,
  singleSelectFieldOptions: PropTypes.object,
  updateComplicatedFields: PropTypes.func,
  createNewSectionAfterThis: PropTypes.func,
  deleteComplicatedField: PropTypes.func,
  // multiSelectOptionValues: PropTypes.array,
  chapters: PropTypes.array.isRequired,
  updateTranscript: PropTypes.func.isRequired,
  isTranscriptStateRevoked: PropTypes.bool
}

export default React.memo(EditableChapter)
