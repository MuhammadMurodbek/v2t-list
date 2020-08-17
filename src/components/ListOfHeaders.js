/* eslint-disable react/prop-types */

import React, { Fragment } from 'react'
import { EuiText, EuiPanel, EuiFormRow } from '@patronum/eui'
import '../App.css'
import { EuiI18n } from '@patronum/eui'

const ListOfHeaders = ({ headers }) => {
  const listItems = headers.map((header, i) => (
    <li
      key={i}
      style={header.done === true ? { textDecoration: 'line-through', color: 'green' } : {}}
    >
      <EuiText>{header.name}</EuiText>
    </li>
  ))

  return (
    <Fragment>
      <EuiFormRow label={<EuiI18n token="searchWord" default="Search word" />}>
        <EuiPanel>
          <ul>
            {listItems}
          </ul>
        </EuiPanel>
      </EuiFormRow>
    </Fragment>
  )
}

export default ListOfHeaders
