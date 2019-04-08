import React, { Component } from 'react'
import moment from 'moment'
import { EuiInMemoryTable, EuiButtonEmpty } from '@elastic/eui'

export default class TransactionList extends Component {

  static defaultProps = {
    transcripts: []
  }

  static columns = [
    {
      field: 'created', name: 'Created', sortable: true, render: created => moment(created).format('YYYY-MM-DD HH:mm:ss')
    },
    { name: 'Type', render: () => 'voice' },
    { field: 'id', name: 'Id', sortable: true },
    {
      field: 'id',
      name: 'File',
      // sortable: true,
      render: (id) => {
        const fileName = `http://localhost:6106/api/v1/transcription/${id}`
        return <EuiButtonEmpty iconType="play" href={`/#edit/${id}`}>{fileName}</EuiButtonEmpty>
      }
    }
  ]

  render() {
    const { transcripts } = this.props
    const { columns } = TransactionList

    return (
      <EuiInMemoryTable
        pagination
        sorting={{ sort: { field: 'created', direction: 'asc' } }}
        columns={columns}
        items={transcripts}
        search={{ onChange: () => {} }}
      />
    )
  }
}
