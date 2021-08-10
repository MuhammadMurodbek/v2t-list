/* eslint-disable no-console */
import React, { useState, useRef } from 'react'
import {
  EuiInMemoryTable,
  EuiI18n,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer
} from '@patronum/eui'
import Timeline from '../components/conversation/Timeline'
import ConversationTabs from '../components/conversation/ConversationTabs'
import Page from '../components/Page'
import Player from '../components/conversation/Player'
import FirstColumn from '../components/conversation/FirstColumn'
import SecondColumn from '../components/conversation/SecondColumn'
import ThirdColumn from '../components/conversation/ThirdColumn'
import ApproveButtons from '../components/conversation/ApproveButtons'
import PropTypes from 'prop-types'
import api from '../api'

const Transcription = ({ mic, isListOpen, departments }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [conversationData, setConversationData] = useState([])
  const [numberOfSpeakers, setNumberOfSpeakers] = useState(2)
  const [transcriptId, setTranscriptId] = useState(null)
  const [totalDuration, setTotalDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const ref = useRef()

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

  const updateTranscription = (parsedData) => {
    // console.log('data--->', parsedData)
    setConversationData(parsedData)
    
    // TODO: Add a real transcript Id
    if (!transcriptId) {
      setTranscriptId('new')
    }
  }

  const updateRecordingStatus = (recordingStatus) => {
    console.log('recordingStatus', recordingStatus)
    setIsRecording(recordingStatus)
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
          updateRecordingStatus={updateRecordingStatus}
        />
      )
    },
    {
      field: 'col3',
      name: '',
      render: (item) => (
        <ThirdColumn item={item} updateTranscription={updateTranscription} />
      )
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

  const updateTrackLength = (totalAudioLengthInSeconds) => {
    setTotalDuration(totalAudioLengthInSeconds)
  }

  const updateCurrentTime = (timeInSeconds) => {
    setCurrentTime(timeInSeconds)
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
            <EuiSpacer size="l" />
            {transcriptId && (
              <>
                <EuiFlexGroup>
                  <EuiFlexItem grow={3}>
                    <Timeline
                      currentTime={currentTime}
                      lengthOfAudioInSeconds={totalDuration}
                      updateCurrentTime={updateCurrentTime}
                      audioRef={ref}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <Player
                  audioRef={ref}
                  currentTime={currentTime}
                  trackId={transcriptId}
                  setTotalDurationOfTheAudio={updateTrackLength}
                  updateCurrentTime={updateCurrentTime}
                  isRecording={isRecording}
                />
              </>
            )}
            <EuiSpacer size="l" />
            <EuiFlexGroup>
              <EuiFlexItem grow={10} style={{ marginLeft: 200 }}>
                <ConversationTabs
                  conversationData={conversationData}
                  transcriptId={transcriptId}
                  currentTime={currentTime}
                />
              </EuiFlexItem>
            </EuiFlexGroup>

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
