import React from 'react'
import PropTypes from 'prop-types'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'
import { EuiI18n } from '@elastic/eui'

const StartPage = (props) => (
  <EuiI18n token="activityList" default="Activity list">
    {(activityListText) => (
      <Page preferences title={activityListText}>
        <TranscriptionList {...props} />
      </Page>
    )}
  </EuiI18n>
)

StartPage.propTypes = {
  transcripts: PropTypes.array,
  job: PropTypes.any,
  fetchTranscripts: PropTypes.func,
  setPageIndex: PropTypes.func,
  contentLength: PropTypes.number,
  pageIndex: PropTypes.number
}

StartPage.defaultProps = {
  transcripts: PropTypes.array.isRequired
}

export default StartPage
