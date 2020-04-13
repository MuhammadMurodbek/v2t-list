import React from 'react'
import PropTypes from 'prop-types'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'
import { EuiI18n } from '@elastic/eui'

const StartPage = ({ transcripts, job }) => (
  <Page
    preferences
    title={<EuiI18n token="activityList" default="Activity list" />}
  >
    <TranscriptionList transcripts={transcripts} job={job} />
  </Page>
)

StartPage.propTypes = {
  transcripts: PropTypes.array,
  job: PropTypes.any
}

StartPage.defaultProps = {
  transcripts: PropTypes.array.isRequired
}

export default StartPage
