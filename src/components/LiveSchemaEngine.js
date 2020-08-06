// Used react synthetic event
import React, { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  EuiSpacer,
  EuiForm,
  EuiFormRow,
  EuiI18n,
  EuiComboBox
} from '@patronum/eui'
import ListOfHeaders from './ListOfHeaders'
import api from '../api'
import '../App.css'

const LiveSchemaEngine = ({
  listOfSchemas,
  usedSections,
  defaultSchema,
  updatedSections,
  onUpdatedSchema,
  defaultSectionHeaders
}) => {
  const [selectedSchema, setSelectedSchema] = useState(null)
  const [sectionHeaders, setSectionHeaders] = useState(defaultSectionHeaders)

  useEffect(() => {
    updateSectionHeader()
  })

  useEffect(() => {
    if (!selectedSchema && defaultSchema) {
      onSchemaChange([ defaultSchema ])
    }
  }, [ defaultSchema ])

  const getHeaderWithSynonyms = (sectionHeadersInfo) => {
    const headersWithSynonyms = {}
    sectionHeadersInfo.forEach((sectionHeader) => {
      headersWithSynonyms['a'] = sectionHeader.synonyms
      headersWithSynonyms[sectionHeader.name] = headersWithSynonyms['a']
      delete headersWithSynonyms['a']
    })
    return headersWithSynonyms
  }

  const updateSectionHeader = async () => {
    if (selectedSchema && selectedSchema.fields) {
      const updatedSectionHeaders = selectedSchema.fields.map(field => {
        const done = usedSections.includes(field.name)
        return { name: field.name, synonyms: field.headerPatterns || [], done }
      })
      if (JSON.stringify(updatedSectionHeaders) !== JSON.stringify(sectionHeaders)) {
        setSectionHeaders(updatedSectionHeaders)
        // Send the name of the synonyms too
        updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
      }
    }
  }

  const onSchemaChange = async (selectedOptions) => {
    const selectedSchemaId = selectedOptions[0].id
    const { data: schema } = await api.getSchema(selectedSchemaId)
    const updatedSectionHeaders = schema.fields.map(field => {
      const done = usedSections.includes(field.name)
      return { name: field.name, synonyms: field.headerPatterns || [], done }
    })
    setSelectedSchema(schema)
    setSectionHeaders(updatedSectionHeaders)
    // Send the name of the synonyms too
    updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
    onUpdatedSchema(schema)
  }

  const schemaOptions = listOfSchemas
    .map((schema) => ({ ...schema, value: schema.id, label: schema.name }))
  const schemaId = selectedSchema ? selectedSchema.id : null
  const selectedOptions = listOfSchemas.length && schemaId ?
    [{ label: listOfSchemas.find(({id}) => id === schemaId).name }] : []

  return (
    <Fragment>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow
          label={
            <EuiI18n
              token="selectSchema"
              default="Select schema"
            />
          }
        >
          <EuiComboBox
            options={schemaOptions}
            selectedOptions={ selectedOptions }
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

LiveSchemaEngine.propTypes = {
  defaultSchema: PropTypes.object,
  listOfSchemas: PropTypes.array.isRequired,
  usedSections: PropTypes.array.isRequired,
  updatedSections: PropTypes.func.isRequired,
  onUpdatedSchema: PropTypes.func.isRequired,
  defaultSectionHeaders: PropTypes.array.isRequired
}

export default LiveSchemaEngine
