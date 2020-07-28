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
    if (!selectedSchema && defaultSchema) {
      updateSectionHeader()
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
    const { data: schema } = await api.getSchema(selectedSchema || defaultSchema)
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
    const selectedSchema = e[0].id
    const { data: schema } = await api.getSchema(selectedSchema)
    const updatedSectionHeaders = schema.fields.map(field => {
      const done = usedSections.includes(field.name)
      return { name: field.name, synonyms: field.headerPatterns || [], done }
    })
    setSelectedSchema(selectedSchema)
    setSectionHeaders(updatedSectionHeaders)
    // Send the name of the synonyms too
    updatedSections(getHeaderWithSynonyms(updatedSectionHeaders))
    onUpdatedSchema(schema)
  }

  const schemaOptions = listOfSchemas
    .map((schema) => ({ ...schema, value: schema.id, label: schema.name }))
  const schema = selectedSchema || defaultSchema
  const selectedOptions = listOfSchemas.length && schema ?
    [{ label: listOfSchemas.find(({id}) => id === schema).name }] : []

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
  defaultSchema: PropTypes.string,
  listOfSchemas: PropTypes.array.isRequired,
  usedSections: PropTypes.array.isRequired,
  updatedSections: PropTypes.func.isRequired,
  onUpdatedSchema: PropTypes.func.isRequired,
  defaultSectionHeaders: PropTypes.array.isRequired
}

export default LiveSchemaEngine
