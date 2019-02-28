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

  static randomContent = [
    {
      id: 1,
      text: 'some random text',
      status: 'this status',
      url: 'http://localhost:9000/minio/transcriptions/858048.wav',
      createdAt: '2019-02-06T09:04:39.041+0000',
      updatedAt: '2019-02-06T09:04:39.041+0000'
    },
    {
      id: 2,
      text: 'some text2',
      status: 'some status',
      url: 'http://localhost:9000/minio/transcriptions/858058.wav',
      createdAt: '2019-02-06T09:05:39.041+0000',
      updatedAt: '2019-02-06T09:05:39.041+0000'
    }
  ]

  state = {
    transcripts : []
  }

  componentDidMount = () => {
    this.loadData()
  }


  loadData = () => {
    const { transcripts } = this.state
    axios
      .get('/api/v1/v2t-storage/')
      .then((response) => {
        console.log(response.data[0])
        let url = `http://localhost:6102/api/v1/v2t-storage/audio/${response.data[0].callId}`
        let processedData = {
          id: response.data[0].callId,
          callId: response.data[0].callId,
          url,
          createdAt: response.data[0].timestamp,
          updatedAt: response.data[0].timestamp
        }
        this.setState({ transcripts: [...transcripts, processedData] })
      })
      .catch((error) => {
        console.log(error)
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
        items={transcripts}
      />
    )
  }
}
