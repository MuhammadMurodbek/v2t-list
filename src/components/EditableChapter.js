/* eslint-disable no-console */
import React from 'react'
import { EuiFormRow } from '@patronum/eui'
import SectionHeader from '../components/SectionHeader'
import PropTypes from 'prop-types'
import Chunks from '../components/Chunks'
import ComplicatedField from './ComplicatedField'

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
  ...chunkProps
}) => {
  const sectionHeaders = schema.fields
    ? schema.fields.map(({ name }) => name)
    : []
  const field = schema.fields
    ? schema.fields.find(({ id }) => id === keyword)
    : null
  const isVisible = field ? field.visible : true
  const sectionHeader = field ? field.name : ''
  const isMultiSelectEnabled = field ? field.multiSelect : false
  let isSingleSelectEnabled = false
  if (!isMultiSelectEnabled) {
    if (field) {
      if (field.choiceValues) {
        if (field.choiceValues.length > 0) {
          isSingleSelectEnabled = true
        }
      }
      // console.log('field', field.name)
      // console.log('isMultiSelectEnabled', isMultiSelectEnabled)
      // console.log('isSingleSelectEnabled', isSingleSelectEnabled)
    }
  }

  const namePatterns = field
    ? [field.name, ...(field.headerPatterns || [])]
    : []
  const escapedNamePatterns = namePatterns.map(escapeRegularExpression)
  const regex = new RegExp(`^(${escapedNamePatterns.join(' |')} )?(.?)`, 'i')
  const filteredSegments = segments.map((segment, i) => {
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
  // console.log('filteredSegments', filteredSegments)
  // console.log('segments', segments)
  // console.log('field', field)
  const joinedSegments = segments.map((segment) => segment.words).join('')
  // console.log('joinedSegments', joinedSegments)
  const selectedChoice = field
    ? field.choiceValues
      ? field.choiceValues.filter(
        // (ch) => ch.toLowerCase() === joinedSegments.toLowerCase())
        (ch) => {
          if(joinedSegments.length) {
            return joinedSegments.toLowerCase().includes(ch.toLowerCase())
          }
        }
      )
      : []
    : []
  // console.log('selectedChoice', selectedChoice)
  // console.log('complicatedFieldOptions------>', complicatedFieldOptions)
  // console.log('isSingleSelectEnabled------>', isSingleSelectEnabled)
  // console.log('isMultiSelectEnabled------>', isMultiSelectEnabled)
  // console.log('sectionHeader------>', sectionHeader)
  return (
    <EuiFormRow
      style={{
        maxWidth: '100%',
        display: isVisible ? 'default' : 'none'
      }}
    >
      <>
        <SectionHeader
          keywords={sectionHeaders}
          selectedHeader={sectionHeader}
          updateKey={setKeyword}
          chapterId={chapterId}
        />
        {(isMultiSelectEnabled && complicatedFieldOptions[sectionHeader]) && (
          <>
            <ComplicatedField
              complicatedFieldOptions={complicatedFieldOptions}
              updateComplicatedFields={updateComplicatedFields}
              selectedChoice={selectedChoice}
              sectionHeader={sectionHeader}
              chapterId={chapterId}
              createNewSectionAfterThis={createNewSectionAfterThis}
              deleteComplicatedField={deleteComplicatedField}
              id={chunkProps.id}
              isSingleSelectEnabled={isSingleSelectEnabled}
            />
          </>
        )}
        {(isSingleSelectEnabled && singleSelectFieldOptions[sectionHeader]) && (
          <>
            <ComplicatedField
              complicatedFieldOptions={singleSelectFieldOptions}
              updateComplicatedFields={updateComplicatedFields}
              selectedChoice={selectedChoice}
              sectionHeader={sectionHeader}
              chapterId={chapterId}
              createNewSectionAfterThis={createNewSectionAfterThis}
              deleteComplicatedField={deleteComplicatedField}
              id={chunkProps.id}
              isSingleSelectEnabled={isSingleSelectEnabled}
            />
          </>
        )}
        {!isSingleSelectEnabled && !isMultiSelectEnabled && (
          <Chunks
            recordingChapter={recordingChapter}
            chapterId={chapterId}
            segments={filteredSegments}
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
  deleteComplicatedField: PropTypes.func
}

export default EditableChapter