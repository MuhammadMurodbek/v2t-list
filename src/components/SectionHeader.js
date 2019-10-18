/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState } from 'react'
import {
    EuiTextAlign, 
    EuiForm,
    EuiFormRow,
    EuiFlexGroup,
    EuiFlexItem,
    EuiFilePicker,
    EuiButton,
    EuiSuperSelect, EuiSpacer, EuiText,
    EuiGlobalToastList,
    EuiProgress
} from '@elastic/eui'
import DropDown from '../components/DropDown'

const SectionHeader = ({ isVisible, keywords, selectedHeader}) => {
  const [selectedKeyword, setSelectedKeyword] = useState(selectedHeader)
  const onKeywordChange = (k) => {
    setSelectedKeyword(k)
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
