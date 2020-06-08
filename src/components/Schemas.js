/* eslint-disable react/prop-types */
// Used react synthetic event
import React, { Fragment } from 'react'
import {
  EuiSpacer,
  EuiText,
  EuiForm,
  EuiFormRow,
  EuiComboBox,
  EuiI18n
} from '@elastic/eui'
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
      <EuiText size="xs">
        <h2>
          <EuiI18n token="schema" default="Schema" />
        </h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm style={{ maxWidth: 350}}>
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
