/* eslint-disable no-console */
import React from 'react'
import moment from 'moment'
import api from '../api'
import { EuiI18n } from '@elastic/eui'

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
    label: 'Skapad',
    field: 'created_time',
    name: <EuiI18n token="created" default="Created" />,
    width: '170px',
    // sortable: true,
    render: (created) => moment(created).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    label: 'Typ',
    name: <EuiI18n token="type" default="Type" />,
    width: '70px',
    render: (transcript) =>
      `${
        (transcript || {}).media_content_type
          ? transcript.media_content_type
          : 'ljud'
      }`
  },
  {
    label: 'Doktor',
    name: <EuiI18n token="doctor" default="Doctor" />,
    width: '140px',
    render: (transcript) =>
      `${
        ((transcript || {}).fields || {}).doctor_full_name
          ? transcript.fields.doctor_full_name
          : ''
      }`
  },
  {
    label: 'Patient',
    name: <EuiI18n token="patient" default="Patient" />,
    width: '140px',
    render: (transcript) =>
      `${
        ((transcript || {}).fields || {}).patient_full_name
          ? transcript.fields.patient_full_name
          : ''
      }`
  },
  {
    label: 'PatientId',
    name: <EuiI18n token="patientId" default="Patient ID" />,
    width: '150px',
    render: (transcript) =>
      `${
        ((transcript || {}).fields || {}).patient_id
          ? transcript.fields.patient_id
          : ''
      }`
  },
  {
    label: 'Avdelning',
    name: <EuiI18n token="section" default="Section" />,
    width: '200px',
    render: (transcript) =>
      `${
        ((transcript || {}).fields || {}).department_name
          ? transcript.fields.department_name
          : ''
      }`
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
    if (this._autoPlayStatus === true) {
      this._autoPlayStatus = false
      localStorage.setItem('autoPlayStatus', this._autoPlayStatus)
    } else if (this._autoPlayStatus === false) {
      this._autoPlayStatus = true
      localStorage.setItem('autoPlayStatus', this._autoPlayStatus)
    } else {
      const autoPlayStatusFromStorage = localStorage.getItem('autoPlayStatus')
      if (autoPlayStatusFromStorage === 'true') {
        this._autoPlayStatus = true
      } else if (autoPlayStatusFromStorage === 'false') {
        this._autoPlayStatus = false
      } else {
        this._autoPlayStatus = true
      }
      localStorage.setItem('autoPlayStatus', this._autoPlayStatus)
    }
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
    autoPlayStatus: true,
    stopButtonVisibilityStatus: false,
    columns: COLUMN_OPTIONS,
    columnsForCombo: COLUMN_OPTIONS.map(({ render, ...items }) => items).filter(
      (column) =>
        column.label !== 'Id' &&
        column.label !== 'Öppna' &&
        column.label !== 'Ta bort'
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
    currentFontSize: '18px',
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
