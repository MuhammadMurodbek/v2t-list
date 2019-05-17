import React from 'react'
import { EuiI18n } from '@elastic/eui'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'

const StartPage = ({ transcripts }) => (
  <Page preferences title={<EuiI18n token="startTitle" default="Active Backlog" />}>
    <TranscriptionList transcripts={transcripts} />
  </Page>
)

export default StartPage
