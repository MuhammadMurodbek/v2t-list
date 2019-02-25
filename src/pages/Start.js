import React, { Component } from 'react'
import { EuiI18n } from '@elastic/eui'

import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'

export default class StartPage extends Component {

  render() {
    return (
      <Page title={<EuiI18n token="startTitle" default="Work load" />}>
        <TranscriptionList />
      </Page>
    )
  }
}
