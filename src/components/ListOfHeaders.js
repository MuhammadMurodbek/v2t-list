/* eslint-disable react/prop-types */
import React, { Fragment } from 'react'
import { EuiText, EuiPanel, EuiFormRow } from '@elastic/eui'

const ListOfHeaders = ({ headers, schema }) => {
  const schemaName = schema.name || ''
  const schemaLabel = `Schema: ${schemaName}`
  const listItems = headers.map((header, i) => (
    <li
      key={i}
      style={
        header.done === true
          ? { textDecoration: 'line-through', color: 'green' }
          : {}
      }
    >
      <EuiText>{header.name}</EuiText>
    </li>
  ))

  return (
    <Fragment>
      <EuiFormRow label={`${schemaLabel}`}>
        <EuiPanel>
          <ul>{listItems}</ul>
        </EuiPanel>
      </EuiFormRow>
    </Fragment>
  )
}

export default ListOfHeaders
