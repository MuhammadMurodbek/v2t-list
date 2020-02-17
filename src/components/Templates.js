/* eslint-disable react/prop-types */
// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import DropDown from './DropDown'
import {
  EuiSpacer, EuiText, EuiForm, EuiFormRow, EuiSuperSelect
} from '@elastic/eui'
import '../App.css'


const Templates = ({
  listOfTemplates,
  defaultTemplate,
  updateSectionHeader,
  updateTemplateId
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate)
  const [templateId, setTemplateId] = useState(defaultTemplate)
  
  useEffect(()=>{
    updateSectionHeader(sectionNames)
    updateTemplateId(templateId)
  }, [selectedTemplate])

  const onTemplateChange = (e) => {
    setTemplateId(e)
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

  const template = listOfTemplates
    .find(template => template.id === selectedTemplate)
  const sections = template ? template.sections : []
  const sectionNames = sections.map(section => section.name)
  
  return (  
    <Fragment>
      <EuiText size="xs">
        <h2>Journalmallar</h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow label="Välj journalmall">
          <EuiSuperSelect
            className="templateSelect"
            options={templateOptions}
            valueOfSelected={defaultTemplate}
            onChange={onTemplateChange}
            itemLayoutAlign="top"
          />
        </EuiFormRow>
      </EuiForm>
    </Fragment>
  )
}

export default Templates
