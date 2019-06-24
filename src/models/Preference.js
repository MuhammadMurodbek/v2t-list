import React from 'react'
import moment from 'moment'
import { EuiButtonEmpty } from '@elastic/eui'

export const WORD_OPTIONS = [
  { id: '1', label: '1' },
  { id: '3', label: '3' },
  { id: '5', label: '5' }
]

export const COLUMN_OPTIONS = [
  {
    label: 'created',
    field: 'created',
    name: 'Created',
    sortable: true,
    render: created => moment(created).format('YYYY-MM-DD HH:mm:ss')
  },
  { label: 'type', name: 'Type', render: () => 'voice' },
  { label: 'name', name: 'Doctor name', render: () => 'Maria S' },
  { label: 'id', field: 'id', name: 'Id', sortable: true },
  {
    label: 'open',
    field: 'id',
    name: '',
    width: '100px',
    render: (id) => <EuiButtonEmpty iconType="play" href={`/#edit/${id}`}>Open</EuiButtonEmpty>
  }
]

export default class Preference {

  get words() { return this._words } set words(v) { this._words = v }
  get keywords() { return this._keywords } set keywords(v) { this._keywords = v }
  get audioOnly() { return this._audioOnly } set audioOnly(v) { this._audioOnly = v }
  get highlightMode() { return this._highlightMode } set highlightMode(v) { this._highlightMode = v }
  get columns() { return this._columns } set columns(v) { this._columns = v }
  get allColumns() { return this._allColumns } set allColumns(v) { this._allColumns = v }

  static defaultState = {
    words: '3',
    keywords: [{ label: 'Symptom' }, { label: 'Status' }, { label: 'Diagnos' }, { label: 'General' }],
    audioOnly: false,
    highlightMode: false,
    columns: COLUMN_OPTIONS.filter(column => column.label !== 'id'),
    allColumns: COLUMN_OPTIONS
  }

  constructor(state = Preference.defaultState) {
    this.add(state)
  }

  add(state) {
    Object.entries(state).forEach(([key, value]) => this[key] = value)
    return this
  }

  clone(additionalState) {
    const { __proto__, ...state } = this
    return new Preference({...state, ...additionalState})
  }

}
