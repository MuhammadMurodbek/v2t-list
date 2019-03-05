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
      name: 'DRG Code',
      sortable: true,
      width: '70px'
    }, {
      field: 'info',
      name: 'Description',
      width: '200px'
    }]
    return (
      <React.Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiBasicTable
          className="transcript"
          items={values}
          columns={columns}
        />
      </React.Fragment>
    )
  }
}
