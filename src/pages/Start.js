import React from 'react'
import PropTypes from 'prop-types'
import { EuiI18n } from '@elastic/eui'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'

const StartPage = ({ transcripts }) => (
  <Page preferences title={<EuiI18n token="startTitle" default="Active Backlog" />}>
    <TranscriptionList transcripts={transcripts} />
  </Page>
)

StartPage.propTypes = {
  transcripts: PropTypes.array
}

StartPage.defaultProps = {
  transcripts: []
}

export default StartPage
