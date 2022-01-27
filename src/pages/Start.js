import React from 'react'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'
import { EuiI18n } from '@inoviaab/eui'

const StartPage = (props) => (
  <EuiI18n token="activityList" default="Activity list">
    {(activityListText) => (
      <Page preferences title={activityListText}>
        <TranscriptionList {...props} />
      </Page>
    )}
  </EuiI18n>
)

export default StartPage
