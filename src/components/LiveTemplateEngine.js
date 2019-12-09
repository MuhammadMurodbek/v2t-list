// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import DropDown from './DropDown'
import {
  EuiSpacer,
  EuiText,
  EuiForm,
  EuiFormRow,
  EuiSuperSelect
} from '@elastic/eui'
import ListOfHeaders from './ListOfHeaders'
import '../App.css'

const LiveTemplateEngine = ({ listOfTemplates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('ext1')
  const [sectionHeaders, setSectionHeaders] = useState([
    { name: 'KONTAKTORSAK', done: true },
    { name: 'AT', done: false },
    { name: 'LUNGOR', done: false },
    { name: 'BUK', done: false },
    { name: 'DIAGNOS', done: false }])
    
  const onTemplateChange = (e) => {
    console.log('e')
    console.log(e)
    setSelectedTemplate(e)
    listOfTemplates.map(template => {
      if(template.id===e) {
        setSectionHeaders(template.sections.map(section =>{return { name: section.name, 'done': false }}))
      }
    })
  }

  const templateOptions = listOfTemplates.map((template) => {
    return {
      value: template.id,
      inputDisplay: template.name,
      dropdownDisplay: ( <DropDown title={template.name} />)
    }
  })

  // const template = listOfTemplates.find(template => template.id === selectedTemplate)
  // const sections = template ? template.sections : []
  // const sectionNames = sections.map(section => section.name)

  return (
    <Fragment>
      <EuiText size="xs">
        <h2>Available Templates</h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow label="Välj journalmall">
          <EuiSuperSelect
            options={templateOptions}
            valueOfSelected={selectedTemplate}
            onChange={onTemplateChange}
            itemLayoutAlign="top"
          />
        </EuiFormRow>
      </EuiForm>
      <EuiSpacer size="m" />
        <ListOfHeaders headers={sectionHeaders} />
    </Fragment>
  )
}

export default LiveTemplateEngine
