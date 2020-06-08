/* eslint-disable react/prop-types */
/* eslint-disable no-console */
// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import { EuiSpacer, EuiForm, EuiFormRow, EuiComboBox } from '@elastic/eui'
import ListOfHeaders from '../ListOfHeaders'
import api from '../../api'
import '../../App.css'

const GuidedLiveSchema =  ({
  listOfSchemas, usedSections, updatedSections, schemaFromVoice
}) => {
  const defaultSchema = listOfSchemas && listOfSchemas.find(({name}) => name === 'Allergi')
  const defaultId = defaultSchema && defaultSchema.id
  const [selectedSchema, setSelectedSchema] = useState(defaultId)
  const [sectionHeaders, setSectionHeaders] = useState([
    { name: 'KONTAKTORSAK', done: true },
    { name: 'AT', done: false },
    { name: 'LUNGOR', done: false },
    { name: 'BUK', done: false },
    { name: 'DIAGNOS', done: false }])

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    if (listOfSchemas)
      updateSectionHeader()
  })

  const getHeaderWithSynonyms = (sectionHeadersInfo) => {
    const headersWithSynonyms = {}
    sectionHeadersInfo.forEach(sectionHeader => {
      headersWithSynonyms['a'] = sectionHeader.synonyms
      headersWithSynonyms[sectionHeader.name] = headersWithSynonyms['a']
      delete headersWithSynonyms['a']
    })
    return headersWithSynonyms
  }

  const updateSectionHeader = async () => {
    listOfSchemas.forEach(schema => {
      if (schema.name.trim().toLowerCase() === schemaFromVoice.trim().toLowerCase()) {
        setSelectedSchema(schema.id)
      }
    })
    const { data: schema } = await api.getSchema(selectedSchema)

    const updatedSectionHeaders = schema.fields.map(field => {
      const done = usedSections.includes(field.name)
      return { name: field.name, synonyms: field.headerPatterns || [], done }
    })
    if (JSON.stringify(updatedSectionHeaders) !== JSON.stringify(sectionHeaders)) {
      setSectionHeaders(updatedSectionHeaders)
      // Send the name of the synonyms too
      updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
    }
  }

  const onSchemaChange = async (e) => {
    setSelectedSchema(e)
    const { data: schema } = await api.getSchema(selectedSchema)
    const updatedSectionHeaders = schema.fields.map(field => {
      const done = usedSections.includes(field.name)
      return { name: field.name, synonyms: field.headerPatterns || [], done }
    })
    setSectionHeaders(updatedSectionHeaders)
    // Send the name of the synonyms too
    updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
  }

  const schemaOptions = (listOfSchemas || [])
    .map((schema) => ({ ...schema, value: schema.id, label: schema.name }))
    const selectedOptions = selectedSchema || defaultId ?
      [{ label: selectedSchema || defaultId }] : []

  return (
    <Fragment>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow label="Välj journalmall">
          <EuiComboBox
            options={schemaOptions}
            selectedOptions={selectedOptions}
            singleSelection={{ asPlainText: true }}
            onChange={onSchemaChange}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiForm>
      <EuiSpacer size="m" />
      <ListOfHeaders headers={sectionHeaders} />
    </Fragment>
  )
}

export default GuidedLiveSchema
