// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react'
import { EuiComboBox, EuiI18n } from '@patronum/eui'

const SectionHeader = ({
  keywords,
  selectedHeader,
  updateKey,
  chapterId
}) => {
  const [selectedKeyword, setSelectedKeyword] = useState(selectedHeader)

  useEffect(() => {
    setSelectedKeyword(selectedHeader)
  })

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
    < EuiI18n
      token="selectAKeyword"
      default="Select A Keyword"
    >
      {(translation) => (
        <EuiComboBox
          className="sectionHeader"
          placeholder={translation}
          options={keywordsOptions}
          selectedOptions={selectedKeyword ? [{ label: selectedKeyword }] : []}
          singleSelection={{ asPlainText: true }}
          onChange={onKeywordChange}
          isClearable={false}
        />
      )}
    </EuiI18n>
  )
}

export default SectionHeader
