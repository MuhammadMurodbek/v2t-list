/* eslint-disable no-console */
import React from 'react'
import { EuiFormRow } from '@elastic/eui'
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
  multiSelectOptionValues,
  chapters,
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
  let isComplicatedSelect = false
  if (field) {
    if (field.choiceValues) {
      if (field.choiceValues.length > 0) {
        isComplicatedSelect = true
        if (!isMultiSelectEnabled) {
          isSingleSelectEnabled = true
        }
      }
    }
  }

  let filteredSegments = segments 

  if (/live-diktering/.test(window.location.href)) {
    const namePatterns = field
      ? [field.name, ...(field.headerPatterns || [])]
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
  const selectedChoice = field
    ? field.choiceValues
      ? field.choiceValues.filter(
        (ch) =>
          ch.toLowerCase().trim() === joinedSegments.toLowerCase().trim()
      )
      : []
    : []

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
      ...props
    }
  }
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
        {(isSingleSelectEnabled && singleSelectFieldOptions[sectionHeader]) && (
          <>
            <ComplicatedField
              {...getComplicatedFieldProps({
                selectedChoice,
                complicatedFieldOptions: singleSelectFieldOptions
              })}
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
  deleteComplicatedField: PropTypes.func,
  multiSelectOptionValues: PropTypes.array,
  chapters: PropTypes.array.isRequired
}

export default EditableChapter


