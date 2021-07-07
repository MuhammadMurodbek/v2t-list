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
  // console.log('field', field.name)
  // console.log('isMultiSelectEnabled', isMultiSelectEnabled)
  // console.log('choiceValues', field.choiceValues)
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
  return (
    <EuiFormRow
      style={{
        maxWidth: '100%',
        display: isVisible ? 'default' : 'none'
        // ,
        // borderBottom: isMultiSelectEnabled ? '1px solid green' : 'none',
        // padding: isMultiSelectEnabled ? '10px' : 'none'
      }}
    >
      <>
        <SectionHeader
          keywords={sectionHeaders}
          selectedHeader={sectionHeader}
          updateKey={setKeyword}
          chapterId={chapterId}
        />
        {isMultiSelectEnabled ? (
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
            />
          </>
        ) : (
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
  updateComplicatedFields: PropTypes.func,
  createNewSectionAfterThis: PropTypes.func,
  deleteComplicatedField: PropTypes.func
}

export default EditableChapter