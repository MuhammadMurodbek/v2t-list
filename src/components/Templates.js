// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import DropDown from './DropDown'
import {
    EuiSpacer,
    EuiText, EuiForm, EuiFormRow, EuiSuperSelect
} from '@elastic/eui'
import '../App.css'


const Templates = ({ listOfTemplates, defaultTemplate, updateSectionHeader }) => {
  
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate)
  
  useEffect(()=>{
    updateSectionHeader(sectionNames)
  }, [selectedTemplate])

  const onTemplateChange = (e) => {
    setSelectedTemplate(e)
  }
  
  const templateOptions = listOfTemplates.map((template) => {
    return {
      value: template.id,
      inputDisplay: template.name,
      dropdownDisplay: (
        <DropDown
          title={template.name}
        />
      )
    }}
  )

  const template = listOfTemplates.find(template => template.id === selectedTemplate)
  const sections = template ? template.sections : []
  const sectionNames = sections.map(section => section.name)
  
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
