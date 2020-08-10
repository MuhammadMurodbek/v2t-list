/* eslint-disable react/prop-types */
// Used react synthetic event
import React, { Fragment } from 'react'
import {
  EuiForm,
  EuiFormRow,
  EuiComboBox,
  EuiI18n
} from '@patronum/eui'
import '../App.css'

const Schemas = ({ schemas, schemaId, onUpdate }) => {
  const options = schemas
    .map((schema) => ({ ...schema, value: schema.id, label: schema.name }))
  const schema = options.find(t => t.value === schemaId) || { label: '' }

  const onSchemaChange = (schemas) => {
    if (!schemas.length) return
    const schema = schemas[0]
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
            selectedOptions={[schema]}
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
