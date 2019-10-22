/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState } from 'react'
import {
    EuiFormRow,
    EuiSuperSelect
} from '@elastic/eui'
import DropDown from '../components/DropDown'

const SectionHeader = ({ isVisible, keywords, selectedHeader, updateKey, chapterId}) => {
  const [selectedKeyword, setSelectedKeyword] = useState(selectedHeader)
  const onKeywordChange = (k) => {
    setSelectedKeyword(k)
    updateKey(k, chapterId)
  }

  const keywordsOptions = keywords.map((keyword) => {
    return {
      value: keyword,
      inputDisplay: keyword,
      dropdownDisplay: (
        <DropDown
          title={keyword}
        />
      )
    }
  }
  )

  return (
    <EuiFormRow label="Name of the Section">
      <EuiSuperSelect
        options={keywordsOptions}
        valueOfSelected={selectedKeyword}
        onChange={onKeywordChange}
        itemLayoutAlign="top"
        hasDividers
      />
    </EuiFormRow>
  )
}

export default SectionHeader
