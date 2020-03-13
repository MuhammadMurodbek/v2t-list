import React from 'react'
import PropTypes from 'prop-types'
import Page from '../components/Page'
import TranscriptionList from '../components/TranscriptionList'

const StartPage = ({ transcripts, job }) => (
  <Page preferences title="Aktivitietslista">
    <TranscriptionList transcripts={transcripts} job={job}/>
  </Page>
)

StartPage.propTypes = {
  transcripts: PropTypes.array
}

StartPage.defaultProps = {
  transcripts: PropTypes.array.isRequired
}

export default StartPage
