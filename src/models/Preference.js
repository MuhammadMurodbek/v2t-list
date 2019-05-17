import React from 'react'
import moment from 'moment'
import { EuiButtonEmpty } from '@elastic/eui'

export default class Preference {

  get words() { return this._words } set words(v) { this._words = v }
  get keywords() { return this._keywords } set keywords(v) { this._keywords = v }
  get audioOnly() { return this._audioOnly } set audioOnly(v) { this._audioOnly = v }
  get columns() { return this._columns } set columns(v) { this._columns = v }
  get allColumns() { return this._allColumns } set allColumns(v) { this._allColumns = v }

  constructor(selected = []) {
    this.words = 3
    this.keywords = ['Symptom', 'Status', 'Diagnos', 'General', 'At', 'Lungor', 'Buk']
    this.audioOnly = false
    this.columns = selected
    this.allColumns = [{ label: 'id' }, { label: 'type' }]
  }

}

export const COLUMN_OPTIONS = [
  {
    label: 'created',
    field: 'created',
    name: 'Created',
    sortable: true,
    render: created => moment(created).format('YYYY-MM-DD HH:mm:ss')
  },
  { label: 'type', name: 'Type', render: () => 'voice' },
  { label: 'id', field: 'id', name: 'Id', sortable: true },
  {
    label: 'file',
    field: 'id',
    name: 'File',
    render: (id) => {
      const fileName = `http://localhost:6106/api/v1/transcription/${id}`
      return <EuiButtonEmpty iconType="play" href={`/#edit/${id}`}>{fileName}</EuiButtonEmpty>
    }
  }
]
