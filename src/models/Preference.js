/* eslint-disable no-console */
import React from 'react'
import moment from 'moment'
import swal from 'sweetalert'
import { EuiButtonEmpty } from '@elastic/eui'
import api from '../api'

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
    label: 'created',
    field: 'created_time',
    name: 'Skapad',
    width: '170px',
    // sortable: true,
    render: created => moment(created)
      .format('YYYY-MM-DD HH:mm:ss')
  },
  {
    label: 'type',
    name: 'Typ',
    width: '70px',
    render: transcript => `${(transcript || {}).media_content_type ? transcript.media_content_type : 'voice'}`
  },
  {
    label: 'doctorsName',
    name: 'Doktor',
    width: '140px',
    render: transcript => `${((transcript || {}).fields || {}).doctor_full_name ? transcript.fields.doctor_full_name : ''}`
  },
  {
    label: 'patientsName',
    name: 'Patient',
    width: '140px',
    render: transcript => `${((transcript || {}).fields || {}).patient_full_name ? transcript.fields.patient_full_name : ''}`
  },
  {
    label: 'patientId',
    name: 'Patients Personnummer',
    width: '150px',
    render: transcript => `${((transcript || {}).fields || {}).patient_id ? transcript.fields.patient_id : ''}`
  },
  {
    label: 'departmentName',
    name: 'Avdelning',
    width: '200px',
    render: transcript => `${((transcript || {}).fields || {}).department_name ? transcript.fields.department_name : ''}`
  },
  {
    label: 'id',
    field: 'id',
    name: 'Id'
    // sortable: true
  },
  {
    label: 'open',
    field: 'id',
    name: '',
    width: '100px',
    render: id => <EuiButtonEmpty href={`/#edit/${id}`}>Oppna</EuiButtonEmpty>
  },
  {
    label: 'delete',
    field: 'id',
    name: '',
    width: '100px',
    render: id => <EuiButtonEmpty color='danger' onClick={()=>{
      swal({
        title: "Vill du verkligen ta bort diktatet?",
        text: "",
        icon: "warning",
        buttons: ["Avbryt","OK"],
        dangerMode: true
      })
        .then((willDelete) => {
          if (willDelete) {
            swal("Diktatet tas bort!", {
              icon: "success",
            })
          }
        })
    }}>Ta bort</EuiButtonEmpty>
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
    if (currentFontSize==='null') {
      currentFontSize='18px'
    }

    if (this._fontSizeIteration === undefined ) {
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

  get allColumns() {
    return this._allColumns
  }

  set allColumns(v) {
    this._allColumns = v
  }

  static defaultState = {
    words: '3',
    showVideo: true,
    autoPlayStatus: true,
    columns: COLUMN_OPTIONS.filter(column => column.label !== 'id'),
    allColumns: COLUMN_OPTIONS,
    fontSizeList: [{
      value: '15px',
      inputDisplay: 'Small'
    },
      {
        value: '18px',
        inputDisplay: 'Medium'
      },
      {
        value: '20px',
        inputDisplay: 'Large'
      }],
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
    Object.entries(state)
      .forEach(([key, value]) => {
        this[key] = value
      })
    return this
  }

  clone(additionalState) {
    const { __proto__, ...state } = this
    return new Preference({ ...state, ...additionalState })
  }
}
