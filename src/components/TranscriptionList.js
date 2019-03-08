import React, { Component } from 'react'
import moment from 'moment'
import { EuiInMemoryTable, EuiButtonEmpty } from '@elastic/eui'

export default class TransactionList extends Component {

  static defaultProps = {
    transcripts: []
  }

  static columns = [
    {
      field: 'createdAt', name: 'Created', sortable: true, render: created => moment(created).format('YYYY-MM-DD HH:mm:ss')
    },
    { name: 'Type', render: () => 'voice' },
    { field: 'callId', name: 'Call Id', sortable: true },
    {
      field: 'audioUri',
      name: 'File',
      sortable: true,
      render: (url, item) => {
        const fileName = url.replace('http://localhost:9000/minio/transcriptions/', '')
        return <EuiButtonEmpty iconType="play" href={`/#edit/${item.callId}`}>{fileName}</EuiButtonEmpty>
      }
    }
  ]

  render() {
    const { transcripts } = this.props
    const { columns } = TransactionList

    return (
      <EuiInMemoryTable
        pagination
        sorting={{ sort: { field: 'createdAt', direction: 'asc' } }}
        columns={columns}
        items={transcripts}
        search={{ onChange: () => {} }}
      />
    )
  }
}
