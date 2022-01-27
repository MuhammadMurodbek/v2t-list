/* eslint-disable react/prop-types */
// Used react synthetic event
import React, { Fragment, useEffect, useState } from 'react'
import {
  EuiForm,
  EuiFormRow,
  EuiComboBox,
  EuiI18n
} from '@inoviaab/eui'
import '../App.css'

const Schemas = ({ schemas, schemaId, onUpdate, location }) => {
  const [options, setOptions] = useState([{ label: '' }])
  const [selectedSchema, setSelectedSchema] = useState({ label: '' })
  const params = new URLSearchParams(location.search || window.location.search)
  useEffect(() => {
    const options = schemas
      .map((schema) => ({ ...schema, value: schema.id, label: schema.name }))
    setOptions(options)
    setSelectedSchema(options.find(t => t.value === schemaId) || { label: '' })

    if (params.has('template')) {
      const template = params.get('template')
      const found = options.find(({ label }) =>
        label.toLowerCase() === template.toLowerCase())

      if (found) {
        setSelectedSchema(found)
        onUpdate(found.value)
      }
    }
  }, [schemaId, schemas])

  const onSchemaChange = (schemas) => {
    if (!schemas.length) return
    const schema = schemas[0]
    setSelectedSchema(schema)
    onUpdate(schema.value)
  }

  return (
    <Fragment>
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
            options={options}
            selectedOptions={[selectedSchema]}
            singleSelection={{ asPlainText: true }}
            onChange={onSchemaChange}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiForm>
    </Fragment>
  )
}

export default Schemas
