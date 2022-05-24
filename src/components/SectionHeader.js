// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react'
import { EuiComboBox, EuiI18n, EuiFormRow } from '@elastic/eui'

const SectionHeader = ({
  keywords,
  selectedHeader,
  updateKey,
  chapterId,
  chapters,
  isComplicatedSelect
}) => {
  const [selectedKeyword, setSelectedKeyword] = useState(selectedHeader)
  const [isInvalid, setIsInvalid] = useState(false)

  useEffect(() => {
    setSelectedKeyword(selectedHeader)
  })

  useEffect(() => {
    const hasRepeatedKeywords =chapters
      .filter(({ keyword }) => keyword === selectedHeader).length > 1
    if (hasRepeatedKeywords || !selectedHeader)
      setIsInvalid(true)
    else
      setIsInvalid(false)
  }, [chapters, selectedHeader])

  const onKeywordChange = (k) => {
    if (k.length) {
      const keyword = k[0] ? k[0].label : ''
      setSelectedKeyword(keyword)
      updateKey(keyword, chapterId)
    }
  }

  const keywordsOptions = keywords.map((keyword) => ({ label: keyword }))

  if (keywords.length === 0) {
    return null
  }

  return (
    <EuiI18n
      token="keywordsError"
      default="All keywords must be set and may only appear once"
    >
      {(translation) => (
        <EuiFormRow
          aria-label="Select a keyword"
          isInvalid={isInvalid} 
          error={translation}>
          <EuiI18n
            token="selectAKeyword"
            default="Select A Keyword"
          >
            {(translation) => (
              <EuiComboBox
                sortMatchesBy="startsWith"
                className={
                  isComplicatedSelect ? 'complicatedSelect' : 'sectionHeader'}
                placeholder={translation}
                options={keywordsOptions}
                selectedOptions={
                  selectedKeyword ? [{ label: selectedKeyword }] : []}
                singleSelection={{ asPlainText: true }}
                onChange={onKeywordChange}
                isClearable={false}
                isInvalid={isInvalid}
              />
            )}
          </EuiI18n>
        </EuiFormRow>
      )}
    </EuiI18n>
  )
}

export default SectionHeader
