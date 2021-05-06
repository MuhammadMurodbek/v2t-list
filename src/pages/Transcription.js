/* eslint-disable no-console */
import React, { useState } from 'react'
import { EuiInMemoryTable, EuiI18n } from '@patronum/eui'
import Page from '../components/Page'
import FirstColumn from '../components/conversation/FirstColumn'
import SecondColumn from '../components/conversation/SecondColumn'
import ApproveButtons from '../components/conversation/ApproveButtons'
import PropTypes from 'prop-types'
import api from '../api'

const Transcription = ({ mic, isListOpen, departments }) => {
  const [numberOfSpeakers, setNumberOfSpeakers] = useState(2)
  const [transcriptId, setTranscriptId] = useState(null)
  const tableOptions = [
    {
      col1: 'listOfTranscriptions',
      col2: '+New live recording',
      col3: '+Import files'
    },
    {
      col1: 'title',
      col2: 'Telephone',
      col3: 'Template',
      col4: 'approve'
    }
  ]

  const onSelectTranscript = (selectedTranscriptId) => {
    console.log('selected transcript id 2', selectedTranscriptId)
    // load transcript data

    // append media
    setTranscriptId(selectedTranscriptId)
    loadTranscriptDetails(selectedTranscriptId)
  }

  const loadTranscriptDetails = async (selectedTranscriptId) => {
    try {
      const { data: transcript } = await api.loadTranscription(
        selectedTranscriptId
      )
      return transcript
    } catch (error) {
      console.error(error)
    }
  }

  const updateTranscription = (data) => {
    const parsedData = JSON.parse(data)
    console.log('data--->', parsedData)
    // TODO: Add a real transcript Id
    if (!transcriptId) {
      setTranscriptId('new')
    }
  }

  const columns = [
    {
      field: 'col1',
      name: '',
      width: '200px',
      render: (item) => (
        <FirstColumn
          item={item}
          isListOpen={isListOpen}
          departments={departments}
          selectTranscript={onSelectTranscript}
        />
      )
    },
    {
      field: 'col2',
      name: '',
      width: '290px',
      render: (item) => (
        <SecondColumn
          item={item}
          numberOfSpeakers={numberOfSpeakers}
          updateNumberOfSpeakers={updateNumberOfSpeakers}
          updateTranscription={updateTranscription}
        />
      )
    },
    {
      field: 'col3',
      name: ''
    },
    {
      field: 'col4',
      name: '',
      width: '500px',
      render: (item) => <ApproveButtons item={item} />
    }
  ]

  const updateNumberOfSpeakers = (speakerNumber) => {
    setNumberOfSpeakers(speakerNumber)
    console.log('number of speaker', speakerNumber)
  }

  return (
    <EuiI18n
      token={mic ? 'live' : 'editor'}
      default={mic ? 'Live Dictation' : 'Editor'}
    >
      {() => (
        <Page preferences title="Transcriptor">
          <div>
            <EuiInMemoryTable
              items={tableOptions}
              columns={columns}
              noItemsMessage={
                <h4
                  style={{
                    textAlign: 'center',
                    padding: '2em'
                  }}
                >
                  Loading ...
                </h4>
              }
            />
          </div>
        </Page>
      )}
    </EuiI18n>
  )
}

Transcription.propTypes = {
  mic: PropTypes.bool,
  isListOpen: PropTypes.bool,
  departments: PropTypes.array
}

export default Transcription
