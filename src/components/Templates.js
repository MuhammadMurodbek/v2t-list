// Used react synthetic event
import React, { Fragment, useState } from 'react'
import DropDown from './Dropdown'
import {
    EuiSpacer,
    EuiText, EuiForm, EuiFormRow, EuiSuperSelect
} from '@elastic/eui'
import '../App.css'


const Templates = ({ listOfTemplates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('telefonanteckning')
  const onTemplateChange = (e) => {
    setSelectedTemplate(e)
  }
  const templateOptions = [{
    value: 'telefonanteckning',
    inputDisplay: 'Telefonanteckning',
    dropdownDisplay: (
      <DropDown
        title="Telefonanteckning"
      />
    )
  }, {
    value: 'remiss',
    inputDisplay: 'Remiss',
    dropdownDisplay: (
      <DropDown
        title="Remiss"
      />
    )
  },{
    value: 'Journal 2',
    inputDisplay: 'Journal 2',
    dropdownDisplay: (
      <DropDown
        title="Journal 2"
      />
    )
  }]
  return (  
    <Fragment>
      <EuiText size="xs">
        <h2>Journalmaller</h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow label="Choose template for the transcript">
          <EuiSuperSelect
            options={templateOptions}
            valueOfSelected={selectedTemplate}
            onChange={onTemplateChange}
            itemLayoutAlign="top"
          />
        </EuiFormRow>
      </EuiForm>
    </Fragment>
)}

export default Templates
