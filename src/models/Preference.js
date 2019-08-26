/* eslint-disable no-console */
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
    field: 'created_time',
    name: 'Created',
    // sortable: true,
    render: created => moment(created).format('YYYY-MM-DD HH:mm:ss')
  },
  { label: 'type', name: 'Type', render: () => 'voice' },
  { label: 'name', name: 'Doctor name', render: () => 'Maria S' },
  {
    label: 'id',
    field: 'id',
    name: 'Id',
    // sortable: true
  },
  {
    label: 'open',
    field: 'id',
    name: '',
    width: '100px',
    render: id => <EuiButtonEmpty iconType="play" href={`/#edit/${id}`}>Open</EuiButtonEmpty>
  }
]

export default class Preference {
  get words() { return this._words }

  set words(v) { this._words = v }

  get keywords() { return this._keywords }

  set keywords(v) {
    let keywordsFromCookies = this.getCookie('keywords')
    if (keywordsFromCookies) {
      keywordsFromCookies = JSON.parse(keywordsFromCookies)
    }

    if (keywordsFromCookies !== '') {
      if (this._keywordInit === true || this._keywordInit === undefined) {
        this._keywords = keywordsFromCookies
        this.setCookie('keywords', JSON.stringify(this._keywords), 365)
      } else {
        this._keywords = v
        this.setCookie('keywords', JSON.stringify(this._keywords), 365)
      }
    } else {
      this._keywords = v
      this.setCookie('keywords', JSON.stringify(this._keywords), 365)
    }
    this._keywordInit = false
  }

  get audioOnly() { return this._audioOnly }

  set audioOnly(v) { this._audioOnly = v }

  get autoPlayStatus() {
    return this._autoPlayStatus
  }

  set autoPlayStatus(v) {
    if (this._autoPlayStatus === true) {
      this._autoPlayStatus = false
      this.setCookie('autoPlayStatus', this._autoPlayStatus, 365)
    } else if (this._autoPlayStatus === false) {
      this._autoPlayStatus = true
      this.setCookie('autoPlayStatus', this._autoPlayStatus, 365)
    } else {
      const autoPlayStatusFromCookie = this.getCookie('autoPlayStatus')
      if (autoPlayStatusFromCookie === 'true') {
        this._autoPlayStatus = true
      } else if (autoPlayStatusFromCookie === 'false') {
        this._autoPlayStatus = false
      } else {
        this._autoPlayStatus = true
      }
      this.setCookie('autoPlayStatus', this._autoPlayStatus, 365)
    }
  }

  get currentFontSize() { return this._currentFontSize }

  set currentFontSize(v) {
    const currentFontSize = this.getCookie('currentFontSize')
    if (this._fontSizeIteration === undefined) {
      this._fontSizeIteration = 0
    }
    if (currentFontSize !== '') {
      if (this._fontSizeIteration === 0) {
        this._currentFontSize = currentFontSize
      } else {
        this._currentFontSize = v
      }
    } else {
      this._currentFontSize = v
    }
    this.setCookie('currentFontSize', this._currentFontSize, 365)
    this.setCookie('fontSizeInitialized', 'true', 365)
    this._fontSizeIteration = this._fontSizeIteration + 1
  }

  get fontSizeIteration() { return this._fontSizeIteration }

  set fontSizeIteration(v) { this._fontSizeIteration = v }

  get keywordInit() { return this._keywordInit }

  set keywordInit(v) { this._keywordInit = v }

  get columns() { return this._columns }

  set columns(v) { this._columns = v }

  get allColumns() { return this._allColumns }

  set allColumns(v) { this._allColumns = v }

  static defaultState = {
    words: '3',
    keywords: [{ label: 'Symptom' }, { label: 'Status' }, { label: 'Diagnos' }, { label: 'General' }],
    audioOnly: false,
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
    currentFontSize: '15px',
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

  getCookie = (cname) => {
    let name = `${cname}=`
    let ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i += 1) {
      let c = ca[i]
      while (c.charAt(0) === ' ') {
        c = c.substring(1)
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length)
      }
    }
    return ''
  }

  setCookie = (cname, cvalue, exdays) => {
    let d = new Date()
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
    const expires = `expires=${d.toUTCString()}`
    document.cookie = `${cname}=${cvalue};${expires};path=/`
  }
}
