// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import DropDown from './DropDown'
import {
  EuiSpacer,
  EuiForm,
  EuiFormRow,
  EuiSuperSelect
} from '@elastic/eui'
import ListOfHeaders from './ListOfHeaders'
import '../App.css'

const LiveTemplateEngine = ({ listOfTemplates, usedSections, updatedSections }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('ext1')
  const [sectionHeaders, setSectionHeaders] = useState([
    { name: 'KONTAKTORSAK', done: true },
    { name: 'AT', done: false },
    { name: 'LUNGOR', done: false },
    { name: 'BUK', done: false },
    { name: 'DIAGNOS', done: false }])
    
  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    // Update the document title using the browser API
    updateSectionHeader()
  });

  const updateSectionHeader = () => {
    console.log('sectionheader changed')
    listOfTemplates.forEach(template => {
      if (template.id === selectedTemplate) {
        setSectionHeaders(template.sections.map(section => {
          if (usedSections.includes(section.name)) {
            return { name: section.name, 'done': true }
          } else {
            return { name: section.name, 'done': false }
          }
        }))
        updatedSections(sectionHeaders.map(sectionHeader=>sectionHeader.name))
      }
    })
  }

  const onTemplateChange = (e) => {
    console.log('onTemplateChange')
    console.log(e)
    setSelectedTemplate(e)
    listOfTemplates.forEach(template => {
      if(template.id===e) {
        setSectionHeaders(template.sections.map(section =>{
          if (usedSections.includes(section.name)){
            return { name: section.name, 'done': true }
          } else {
            return { name: section.name, 'done': false }
          }
        }))
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

  return (
    <Fragment>
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
