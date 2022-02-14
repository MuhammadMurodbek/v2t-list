/* eslint-disable no-console */
import React from 'react'
import moment from 'moment'
import api from '../api'
import { EuiI18n, EuiText } from '@elastic/eui'

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
    name: <EuiI18n token="created" default="Created" />,
    render: (createdTime) => {
      return (
        <>
          <EuiText size="s">
            <span>{moment(createdTime).format('YYYY-MM-DD')}</span>
            <p>{moment(createdTime).format('HH:mm:ss')}</p>
          </EuiText>
        </>
      )
    },
    sortable: 'true'
  },
  {
    label: 'Status',
    width: '120px',
    name: <EuiI18n token="status" default="Status" />,
    field: 'status'
  },
  {
    label: 'Schema Name',
    name: <EuiI18n token="template" default="Journal Template" />,
    field: 'schemaName'
  },
  {
    label: 'Received',
    name: <EuiI18n token="receivedTime" default="Received" />,
    field: 'receivedTime',
    render: (receivedTime) =>
      moment(receivedTime).format('YYYY-MM-DD HH:mm:ss'),
    sortable: 'true'
  },
  {
    label: 'Updated',
    name: <EuiI18n token="updatedTime" default="Updated" />,
    field: 'updatedTime',
    render: (updatedTime) => moment(updatedTime).format('YYYY-MM-DD HH:mm:ss'),
    sortable: 'true'
  }
]

export const AUTOCORRECT_TABLE = [
  {
    shortcut: 'MVH',
    value: 'Med vanliga hälsningar'
  },
  {
    shortcut: 'bl.a.',
    value: 'bland annat'
  },
  {
    shortcut: 'd.v.s',
    value: 'det vill saga'
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

  get autoCorrectTable() {
    return this._autoCorrectTable
  }

  set autoCorrectTable(v) {
    this._autoCorrectTable = v
    localStorage.setItem('autoCorrect', JSON.stringify(v))
  }

  get isMedicalAssistantActive() {
    return this._isMedicalAssistantActive
  }

  set isMedicalAssistantActive(v) {
    this._isMedicalAssistantActive = v
    localStorage.setItem('isMedicalAssistantActive', v)
    if(v===false) {
      this._continuousSupportStatus = v
      localStorage.setItem('continuousSupportStatus', v)
    }
  }

  get isSnomedMedicalAssistantActive() {
    return this._isSnomedMedicalAssistantActive
  }

  set isSnomedMedicalAssistantActive(v) {
    this._isSnomedMedicalAssistantActive = v
    localStorage.setItem('isSnomedMedicalAssistantActive', v)
  }

  get medicalAssistantStatus() {
    return this._medicalAssistantStatus
  }

  set medicalAssistantStatus(v) {
    this._medicalAssistantStatus = v
    if (v === true) {
      this._decisionSupportStatus = false
      this._codingSupportStatus = false
      localStorage.setItem('medicalAssistantStatus', 'true')
      localStorage.setItem('decisionSupportStatus', 'false')
      localStorage.setItem('codingSupportStatus', 'false')
    } else if (
      v === false &&
      localStorage.getItem('decisionSupportStatus') === 'false' &&
      localStorage.getItem('codingSupportStatus') === 'false'
    ) {
      this._medicalAssistantStatus = true
      this._decisionSupportStatus = false
      this._codingSupportStatus = false
      localStorage.setItem('medicalAssistantStatus', 'true')
      localStorage.setItem('decisionSupportStatus', 'false')
      localStorage.setItem('codingSupportStatus', 'false')
    } else {
      localStorage.setItem('medicalAssistantStatus', v)
    }
  }

  get continuousSupportStatus() {
    return this._continuousSupportStatus
  }

  set continuousSupportStatus(v) {
    this._continuousSupportStatus = v
    localStorage.setItem('continuousSupportStatus', v)
  }

  get decisionSupportStatus() {
    return this._decisionSupportStatus
  }

  set decisionSupportStatus(v) {
    this._decisionSupportStatus = v
    if (v === true) {
      this._medicalAssistantStatus = false
      this._codingSupportStatus = false
      localStorage.setItem('decisionSupportStatus', 'true')
      localStorage.setItem('medicalAssistantStatus', 'false')
      localStorage.setItem('codingSupportStatus', 'false')
    } else if (
      v === false &&
      localStorage.getItem('medicalAssistantStatus') === 'false' &&
      localStorage.getItem('codingSupportStatus') === 'false'
    ) {
      this._decisionSupportStatus = true
      this._medicalAssistantStatus = false
      this._codingSupportStatus = false
      localStorage.setItem('medicalAssistantStatus', 'false')
      localStorage.setItem('decisionSupportStatus', 'true')
      localStorage.setItem('codingSupportStatus', 'false')
    } else {
      localStorage.setItem('decisionSupportStatus', v)
    }
  }

  get codingSupportStatus() {
    return this._codingSupportStatus
  }

  set codingSupportStatus(v) {
    this._codingSupportStatus = v
    if (v === true) {
      this._medicalAssistantStatus = false
      this._decisionSupportStatus = false
      localStorage.setItem('codingSupportStatus', 'true')
      localStorage.setItem('medicalAssistantStatus', 'false')
      localStorage.setItem('decisionSupportStatus', 'false')
    } else if (
      v === false &&
      localStorage.getItem('medicalAssistantStatus') === 'false' &&
      localStorage.getItem('decisionSupportStatus') === 'false'
    ) {
      this._codingSupportStatus = true
      this._decisionSupportStatus = false
      this._medicalAssistantStatus = false
      localStorage.setItem('medicalAssistantStatus', 'false')
      localStorage.setItem('decisionSupportStatus', 'false')
      localStorage.setItem('codingSupportStatus', 'true')
    } else {
      localStorage.setItem('codingSupportStatus', v)
    }
  }

  static defaultState = {
    words: '3',
    showVideo: true,
    autoPlayStatus: localStorage.getItem('autoPlayStatus') === 'true',
    stopButtonVisibilityStatus: false,
    columns: COLUMN_OPTIONS,
    columnsForCombo: COLUMN_OPTIONS.map(({ render, ...items }) => items).filter(
      (column) =>
        column.label !== 'Id'
    ),
    columnsForTranscriptList: COLUMN_OPTIONS.filter(
      (column) => column.label !== 'Id'
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
    autoCorrectTable: localStorage.getItem('autoCorrect')
      ? JSON.parse(localStorage.getItem('autoCorrect')) : AUTOCORRECT_TABLE,
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
