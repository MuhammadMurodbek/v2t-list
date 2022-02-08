/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { EuiText, EuiSpacer, EuiFieldText } from '@elastic/eui'
import PropTypes from 'prop-types'

const ConversationTabs = ({ conversationData, transcriptId, currentTime }) => {

  const colors = ['red', 'blue', 'green', 'brown']
  const speakers = conversationData
    .map((dialog) => dialog.speaker)
    .map((speaker, i) => {
      return { name: speaker, color: colors[i] }
    })

  const getTheColor = (speaker) => {
    return speakers.filter(
      (selectedSpeaker) => selectedSpeaker.name === speaker
    )[0].color
  }

  const bubbles = conversationData.map((conversation) => {
    return (
      <Bubble
        getColor={getTheColor}
        speaker={conversation.speaker}
        currentTime={currentTime}
        start={conversation.transcription.map((transcript) => transcript.start)}
        end={conversation.transcription.map((transcript) => transcript.end)}
        text={conversation.transcription
          .map((transcript) => transcript.word)
          .join(' ')}
      />
    )
  })

  return (
    <>
      {transcriptId && (
        // <EuiFlexGroup
        //   style={{
        //     marginTop: '24px'
        //   }}
        //   direction="column"
        // >
        <>{bubbles}</>
        // </EuiFlexGroup>
      )}
      <EuiSpacer size="l" />
      <EuiSpacer size="l" />
      <EuiSpacer size="l" />
      <EuiSpacer size="l" />
    </>
  )
}

ConversationTabs.propTypes = {
  conversationData: PropTypes.array.isRequired,
  transcriptId: PropTypes.string
}

export default ConversationTabs


const Bubble = ({ speaker, text, getColor, start, end, currentTime }) => {
  const [value, setValue] = useState(text || '')

  const getActiveBgColor = () => {
    if (end.some(time => time <= currentTime)
      && start.some(time => time >= currentTime)) return 'lightpink'

    return 'lightblue'
  }
  return (
    <div
      style={{
        background: `${getActiveBgColor()}`,
        borderRadius: '8px',
        padding: '8px',
        marginTop: '8px'
      }}
    >
      <EuiText>
        <h6 style={{ color: getColor(speaker) }}>
          Speaker&nbsp;{speaker}
        </h6>
      </EuiText>
      <EuiFieldText
        className="bubble-text"
        value={value}
        fullWidth
        compressed
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}
