/* eslint-disable no-console */
import React from 'react'
import moment from 'moment'
import api from '../api'
import { EuiI18n } from '@patronum/eui'

export const WORD_OPTIONS = [
  {
    id: '1',
    label: '1'
  },
  {
    id: '3',
    label: '3'
  },
  {
    id: '5',
    label: '5'
  }
]

export const COLUMN_OPTIONS = [
  {
    label: 'Id',
    field: 'id',
    name: <EuiI18n token="id" default="Id" />
  },
  {
    label: 'Skapad',
    field: 'createdTime',
    name: <EuiI18n token="createdTime" default="Created" />,
    render: (createdTime) => moment(createdTime).format('YYYY-MM-DD HH:mm:ss'),
    sortable: true
  },
  {
    label: 'Status',
    name: <EuiI18n token="status" default="Status" />,
    field: 'status'
  },
  {
    label: 'Schema Id',
    name: <EuiI18n token="schemaId" default="Schema Id" />,
    field: 'schemaId'
  },
  {
    label: 'Schema Name',
    name: <EuiI18n token="schemaName" default="Schema Name" />,
    field: 'schemaName'
  },
  {
    label: 'Received',
    name: <EuiI18n token="receivedTime" default="Received" />,
    field: 'receivedTime',
    render: (receivedTime) => moment(receivedTime).format('YYYY-MM-DD HH:mm:ss'),
    sortable: true
  },
  {
    label: 'Updated',
    name: <EuiI18n token="updatedTime" default="Updated" />,
    field: 'updatedTime',
    render: (updatedTime) => moment(updatedTime).format('YYYY-MM-DD HH:mm:ss'),
    sortable: true
  }
]

export default class Preference {
  get words() {
    return this._words
  }

  set words(v) {
    this._words = v
  }

  get token() {
    return this._token
  }

  set token(v) {
    this._token = v
    api.setToken(this._token)
    localStorage.setItem('token', this._token)
  }

  get autoPlayStatus() {
    return this._autoPlayStatus
  }

  set autoPlayStatus(v) {
    this._autoPlayStatus = v
    localStorage.setItem('autoPlayStatus', v)
  }

  get stopButtonVisibilityStatus() {
    return this._stopButtonVisibilityStatus
  }

  set stopButtonVisibilityStatus(v) {
    if (this._stopButtonVisibilityStatus === true) {
      this._stopButtonVisibilityStatus = false
      localStorage.setItem(
        'stopButtonVisibilityStatus',
        this._stopButtonVisibilityStatus
      )
    } else if (this._stopButtonVisibilityStatus === false) {
      this._stopButtonVisibilityStatus = true
      localStorage.setItem(
        'stopButtonVisibilityStatus',
        this._stopButtonVisibilityStatus
      )
    } else {
      const stopButtonVisibilityStatusFromStorage = localStorage.getItem(
        'stopButtonVisibilityStatus'
      )
      if (stopButtonVisibilityStatusFromStorage === 'true') {
        this._stopButtonVisibilityStatus = true
      } else if (stopButtonVisibilityStatusFromStorage === 'false') {
        this._stopButtonVisibilityStatus = false
      } else {
        this._stopButtonVisibilityStatus = false
      }
      localStorage.setItem(
        'stopButtonVisibilityStatus',
        this._stopButtonVisibilityStatus
      )
    }
  }

  get showVideo() {
    return this._showVideo
  }

  set showVideo(v) {
    if (this._showVideo === true) {
      this._showVideo = false
      localStorage.setItem('showVideo', this._showVideo)
    } else if (this._showVideo === false) {
      this._showVideo = true
      localStorage.setItem('showVideo', this._showVideo)
    } else {
      const showVideoFromStorage = localStorage.getItem('showVideo')
      if (showVideoFromStorage === 'true') {
        this._showVideo = true
      } else if (showVideoFromStorage === 'false') {
        this._showVideo = false
      } else {
        this._showVideo = true
      }
      localStorage.setItem('showVideo', this._showVideo)
    }
  }

  get currentFontSize() {
    return this._currentFontSize
  }

  set currentFontSize(v) {
    let currentFontSize = localStorage.getItem('currentFontSize')
    if (currentFontSize === 'null') {
      currentFontSize = '18px'
    }

    if (this._fontSizeIteration === undefined) {
      this._fontSizeIteration = 0
    }

    if (this._fontSizeIteration === 0) {
      this._currentFontSize = currentFontSize
    } else {
      this._currentFontSize = v
    }

    localStorage.setItem('currentFontSize', v)
    this._fontSizeIteration = this._fontSizeIteration + 1
  }

  get externalMode() {
    return this._externalMode
  }

  set externalMode(mode) {
    this._externalMode = mode
    localStorage.setItem('externalMode', mode)
  }

  get editReadOnly() {
    return this._editReadOnly
  }

  set editReadOnly(value) {
    this._editReadOnly = value
    localStorage.setItem('editReadOnly', value)
  }

  get fontSizeIteration() {
    return this._fontSizeIteration
  }

  set fontSizeIteration(v) {
    this._fontSizeIteration = v
  }

  get keywordInit() {
    return this._keywordInit
  }

  set keywordInit(v) {
    this._keywordInit = v
  }

  get columns() {
    return this._columns
  }

  set columns(v) {
    this._columns = v
  }

  get columnsForCombo() {
    return this._columnsForCombo
  }

  set columnsForCombo(v) {
    this._columnsForCombo = v
    const visibleLabels = v.map((u) => u.label)
    const updatedColumns = COLUMN_OPTIONS.filter(
      (obj) =>
        obj.label === 'Öppna' ||
        obj.label === 'Ta bort' ||
        visibleLabels.includes(obj.label)
    )
    this._columnsForTranscriptList = updatedColumns
  }

  get columnsForTranscriptList() {
    return this._columnsForTranscriptList
  }

  set columnsForTranscriptList(v) {
    this._columnsForTranscriptList = v
  }

  static defaultState = {
    words: '3',
    showVideo: true,
    autoPlayStatus: localStorage.getItem('autoPlayStatus') === "true",
    stopButtonVisibilityStatus: false,
    columns: COLUMN_OPTIONS,
    columnsForCombo: COLUMN_OPTIONS.map(({ render, ...items }) => items).filter(
      (column) =>
        column.label !== 'Id' &&
        column.label !== 'Schema Id'
    ),
    columnsForTranscriptList: COLUMN_OPTIONS.filter(
      (column) => column.label !== 'Id' &&
      column.label !== 'Schema Id'
    ),
    fontSizeList: [
      {
        value: '15px',
        inputDisplay: <EuiI18n token="small" default="Small" />
      },
      {
        value: '18px',
        inputDisplay: <EuiI18n token="medium" default="Medium" />
      },
      {
        value: '20px',
        inputDisplay: <EuiI18n token="large" default="Large" />
      }
    ],
    currentFontSize: '18px',
    externalMode: localStorage.getItem('externalMode') === 'true',
    editReadOnly: localStorage.getItem('editReadOnly') === 'true',
    fontSizeIteration: 0,
    keywordInit: true
  }

  constructor(state = Preference.defaultState) {
    this.add(state)
    this._fontSizeIteration = this._fontSizeIteration + 1
    this._keywordInit = false
  }

  add(state) {
    Object.entries(state).forEach(([key, value]) => {
      this[key] = value
    })
    return this
  }

  clone(additionalState) {
    const { __proto__, ...state } = this
    return new Preference({ ...state, ...additionalState })
  }
}
