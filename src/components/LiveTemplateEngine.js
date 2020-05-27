// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import {
  EuiSpacer,
  EuiForm,
  EuiFormRow,
  EuiI18n,
  EuiComboBox
} from '@elastic/eui'
import ListOfHeaders from './ListOfHeaders'
import '../App.css'

const LiveTemplateEngine = ({
  listOfTemplates,
  usedSections,
  defaultTemplate,
  updatedSections
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('ext1')
  const [defaultTemplateLoadStatus, setDefaultTemplateLoadStatus] = useState(
    false
  )
  const [sectionHeaders, setSectionHeaders] = useState([
    { name: 'Examination', done: true },
    { name: 'Clinical details', done: false },
    { name: 'Findings', done: false },
    { name: 'Comment', done: false }
  ])

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    if (defaultTemplateLoadStatus === false) {
      setDefaultTemplateLoadStatus(true)
      setSelectedTemplate(defaultTemplate)
    }
    updateSectionHeader()
  })

  const getHeaderWithSynonyms = (sectionHeadersInfo) => {
    const headersWithSynonyms = {}
    sectionHeadersInfo.forEach((sectionHeader) => {
      headersWithSynonyms['a'] = sectionHeader.synonyms
      headersWithSynonyms[sectionHeader.name] = headersWithSynonyms['a']
      delete headersWithSynonyms['a']
    })
    return headersWithSynonyms
  }

  const updateSectionHeader = () => {
    listOfTemplates.forEach((template) => {
      if (template.id === selectedTemplate) {
        const updatedSectionHeaders = template.sections.map((section) => {
          if (usedSections.includes(section.name)) {
            if (section.synonyms) {
              return {
                name: section.name,
                synonyms: section.synonyms,
                done: true
              }
            } else {
              return { name: section.name, synonyms: [], done: true }
            }
          } else {
            if (section.synonyms) {
              return {
                name: section.name,
                synonyms: section.synonyms,
                done: false
              }
            } else {
              return { name: section.name, synonyms: [], done: false }
            }
          }
        })
        if (
          JSON.stringify(updatedSectionHeaders) !==
          JSON.stringify(sectionHeaders)
        ) {
          setSectionHeaders(updatedSectionHeaders)
          // Send the name of the synonyms too
          updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
        }
      }
    })
  }

  const onTemplateChange = (e) => {
    setSelectedTemplate(e[0].id)
    listOfTemplates.forEach((template) => {
      if (template.id === e[0].id) {
        const updatedSectionHeaders = template.sections.map((section) => {
          if (usedSections.includes(section.name)) {
            if (section.synonyms) {
              return {
                name: section.name,
                synonyms: section.synonyms,
                done: true
              }
            } else {
              return { name: section.name, synonyms: [], done: true }
            }
          } else {
            if (section.synonyms) {
              return {
                name: section.name,
                synonyms: section.synonyms,
                done: false
              }
            } else {
              return { name: section.name, synonyms: [], done: false }
            }
          }
        })
        setSectionHeaders(updatedSectionHeaders)
        // Send the name of the synonyms too
        updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
      }
    })
  }

  const templateOptions = listOfTemplates
    .map((template) => ({ ...template, value: template.id, label: template.name }))

  return (
    <Fragment>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow
          label={
            <EuiI18n
              token="selectJournalTemplate"
              default="Select journal template"
            />
          }
        >
          <EuiComboBox
            options={templateOptions}
            selectedOptions={ [{label: selectedTemplate}] }
            singleSelection={{ asPlainText: true }}
            onChange={onTemplateChange}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiForm>
      <EuiSpacer size="m" />
      <ListOfHeaders headers={sectionHeaders} />
    </Fragment>
  )
}

export default LiveTemplateEngine
