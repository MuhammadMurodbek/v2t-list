// Used react synthetic event
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
          'color': header.done === true ? 'gray' : 'black'
          }}>{header.name}
      </li> 
  )

  return (
    <Fragment>
      <EuiPanel>
        <EuiText>
          <h6>Sections</h6>
          <ul>{listItems}</ul>
        </EuiText>
      </EuiPanel>
      <EuiSpacer size="s" />            
    </Fragment>
  )
}

export default ListOfHeaders
