import React from 'react'
import { EuiI18n } from '@elastic/eui'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'

const StartPage = () => (
  <Page title={<EuiI18n token="startTitle" default="Active Back Log" />}>
    <TranscriptionList />
  </Page>
)

export default StartPage
