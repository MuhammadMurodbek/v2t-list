// @ts-nocheck
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect } from 'react'
import { EuiFormRow, EuiComboBox, EuiI18n } from '@elastic/eui'

const SectionHeader = ({
  isVisible,
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
    const keyword = k[0] ? k[0].label : ''
    setSelectedKeyword(keyword)
    updateKey(keyword, chapterId)
  }

  const keywordsOptions = keywords.map((keyword) => ({ label: keyword }))

  return (
    <EuiFormRow
      label={<EuiI18n token="keyword" default="Keyword" />}
      style={{ display: keywords.length > 0 ? 'flex' : 'none' }}
    >
      < EuiI18n
        token="selectAKeyword"
        default="Select A Keyword"
      >
        {(translation) => (
          <EuiComboBox
            placeholder={translation}
            options={keywordsOptions}
            selectedOptions={selectedKeyword ? [{ label: selectedKeyword }] : []}
            singleSelection={{ asPlainText: true }}
            onChange={onKeywordChange}
            isClearable={false}
          />
        )}
      </EuiI18n>
    </EuiFormRow>
  )
}

export default SectionHeader
