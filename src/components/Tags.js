import React, { Component } from 'react'
import {
  EuiText, EuiBasicTable
} from '@elastic/eui'
import '../styles/tags.css'

export default class Tags extends Component {
  static defaultProps = {
    values: []
  }

  state = {
    borderStatus: true
  };

  render() {
    const label = (<h2>Tags</h2>)
    const { values } = this.props
    const { borderStatus } = this.state

    const columns = [{
      field: 'code',
      name: 'Code',
      sortable: true,
      width: '40px'
    }, {
      field: 'info',
      name: 'Details',
      width: '200px'
    }]
    return (
      <React.Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiBasicTable
          items={values}
          columns={columns}
        />
      </React.Fragment>
    )
  }
}
