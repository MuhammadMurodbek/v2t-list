import React, { Component } from 'react'
import {
  EuiText, EuiBasicTable
} from '@elastic/eui'
import '../styles/tags.css'

export default class Tags extends Component {

  static defaultProps = {
    values: []
  }

  static COLUMNS = [
    {
      field: 'code',
      name: 'DRG Code',
      sortable: true,
      width: '70px'
    },
    {
      field: 'info',
      name: 'Probability',
      width: '200px'
    }
  ]

  render() {
    const label = (<h2>Tags</h2>)
    const { values } = this.props

    if (!values) return null
    return (
      <React.Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiBasicTable
          className="transcript"
          items={values}
          columns={Tags.COLUMNS}
        />
      </React.Fragment>
    )
  }
}
