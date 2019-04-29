import React from 'react'
import PropTypes from 'prop-types'
import { EuiI18n } from '@elastic/eui'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'

const StartPage = ({ transcripts }) => (
  <Page title={<EuiI18n token="startTitle" default="Active Back Log" />}>
    <TranscriptionList transcripts={transcripts} />
  </Page>
)

TranscriptionList.propTypes = {
  transcripts: PropTypes.array
}

export default StartPage
