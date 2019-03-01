import React, { Component } from 'react'
import moment from 'moment'
import axios from 'axios'
import { EuiInMemoryTable, EuiButtonEmpty } from '@elastic/eui'

export default class TransactionList extends Component {

  static columns = [
    {
      field: 'createdAt', name: 'Created', sortable: true, render: created => moment(created).format('YYYY-MM-DD HH:mm:ss')
    },
    { name: 'Type', render: () => 'voice' },
    { field: 'callId', name: 'Call Id', sortable: true },
    {
      field: 'url',
      name: 'File',
      sortable: true,
      render: (url, item) => {
        const fileName = url.replace('http://localhost:9000/minio/transcriptions/', '')
        return <EuiButtonEmpty iconType="play" href={`/#edit/${item.id}`}>{fileName}</EuiButtonEmpty>
      }
    }
  ]

  state = {
    transcripts: []
  }

  componentDidMount = () => {
    this.loadData()
  }


  loadData = () => {
    const { transcripts } = this.state
    axios
      .get('/api/v1/v2t-storage/')
      .then((response) => {
        const url = `http://localhost:6102/api/v1/v2t-storage/`
        const processedData = []
        for (let i = 0; i < response.data.length; i += 1) {
          const temp = {
            id: response.data[i].callId,
            callId: response.data[i].callId,
            url,
            createdAt: response.data[i].timestamp,
            updatedAt: response.data[i].timestamp
          }
          processedData.push(temp)
        }
        this.setState({ transcripts: [...transcripts, processedData] })
      })
  }


  render() {
    const { transcripts } = this.state
    const { columns } = TransactionList
    return (
      <EuiInMemoryTable
        pagination
        sorting={{ sort: { field: 'createdAt', direction: 'asc' } }}
        columns={columns}
        items={transcripts[0]}
      />
    )
  }
}
