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

const SectionHeader = ({ isVisible, keywords, selectedHeader}) => {
  const [selectedKeyword, setSelectedKeyword] = useState(selectedHeader)
  const onKeywordChange = (k) => {
    setSelectedKeyword(k)
  }

  return (
    <EuiFormRow label="Name of the Section">
      <EuiSuperSelect
        options={keywords}
        valueOfSelected={selectedKeyword}
        onChange={onKeywordChange}
        itemLayoutAlign="top"
        hasDividers
      />
    </EuiFormRow>
  )
}

export default SectionHeader
