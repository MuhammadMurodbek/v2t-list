// @ts-nocheck
import React from 'react'
import Page from '../components/Page'
import TranscriptSentToCoworker
  from '../components/visualizations/TranscriptSentToCoworker'
import '../styles/pageNotFound.css'

const Visualization = () => {  
  return (
    <Page preferences title="Visualization">
      <TranscriptSentToCoworker />
    </Page>
  )
}

export default Visualization