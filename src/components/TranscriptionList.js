import React, { Component } from 'react';
import moment from 'moment';
import { EuiInMemoryTable, EuiButtonEmpty } from '@elastic/eui';

export default class TransactionList extends Component {
  static columns = [
    {
      field: 'createdAt', name: 'Created', sortable: true, render: created => moment(created).format('YYYY-MM-DD HH:mm:ss') 
    },
    {
      field: 'updatedAt', name: 'Last updated', sortable: true, render: updated => moment(updated).format('YYYY-MM-DD HH:mm:ss')
    },
    { name: 'Type', render: () => 'voice' },
    { field: 'text', name: 'Text', sortable: true },
    {
      field: 'url',
      name: 'File',
      sortable: true,
      render: (url, item) => {
        const fileName = url.replace('http://localhost:9000/minio/transcriptions/', '');
        return <EuiButtonEmpty iconType="play" href={`/#edit/${item.id}`}>{fileName}</EuiButtonEmpty>;
      },
    },
    { field: 'status', name: 'Status', sortable: true },
  ]

  static randomContent = [
    {
      id: 1,
      text: 'some random text',
      status: 'this status',
      url: 'http://localhost:9000/minio/transcriptions/858048.wav',
      createdAt: '2019-02-06T09:04:39.041+0000',
      updatedAt: '2019-02-06T09:04:39.041+0000',
    },
    {
      id: 2,
      text: 'some text2',
      status: 'some status',
      url: 'http://localhost:9000/minio/transcriptions/858058.wav',
      createdAt: '2019-02-06T09:05:39.041+0000',
      updatedAt: '2019-02-06T09:05:39.041+0000',
    },
  ]

  render() {
    const items = TransactionList.randomContent;
    const { columns } = TransactionList;
    return (
      <EuiInMemoryTable
        pagination
        sorting={{ sort: { field: 'createdAt', direction: 'asc' } }}
        columns={columns}
        items={items}
      />
    );
  }
}
