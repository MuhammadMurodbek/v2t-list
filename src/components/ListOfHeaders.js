/* eslint-disable react/prop-types */

import React, { Fragment } from 'react'
import {
  EuiSpacer,
  EuiText,
  EuiPanel
} from '@elastic/eui'
import '../App.css'

const ListOfHeaders = ({ headers }) => {
  const listItems = headers.map((header, i) => 
    <li key={i} style={{ 
      'textDecoration': header.done === true ? 'line-through' : 'none',
      'color': header.done === true ? 'green' : 'black'
    }}>{header.name}
    </li> 
  )

  return (
    <Fragment>
      <EuiPanel>
        <EuiText>
          <h6>Sökord</h6>
          <ul style={{ overflowX: 'auto', height: 'auto' }}>{listItems}</ul>
        </EuiText>
      </EuiPanel>
      <EuiSpacer size="s" />            
    </Fragment>
  )
}

export default ListOfHeaders
