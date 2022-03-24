import React, { useState, forwardRef } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import ConversationTimer from './ConversationTimer'
import SearchBox from './SearchBox'
import PlaybackSpeed from './PlaybackSpeed'
import RecordButton from './RecordButton'


const Player = forwardRef(({
  trackId,
  setTotalDurationOfTheAudio,
  currentTime = 0,
  updateCurrentTime,
  isRecording,
  audioRef
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const jwt = localStorage.getItem('token')
  const src = localStorage.getItem('fileSrc')
  const trackUrl = src ? src 
    : `/api/transcription/v2/${trackId}/media?_token=${jwt}`
  const convertSecondsIntoReadableFormat = (timeInSeconds) => {
    return moment.utc(timeInSeconds * 1000).format('mm:ss')
  }


  const play = () => {
    if (!audioRef || !audioRef.current) return
    audioRef.current.currentTime = currentTime
    audioRef.current.play().catch((e) => {
      console.error(e)
    })
    setIsPlaying(true)
  }
  const pause = () => {
    if (!audioRef || !audioRef.current) return
    audioRef.current.pause()
    setIsPlaying(false)
  }
  const getAudioData = (e) => {
    setTotalDurationOfTheAudio(e.target.duration)
  }
  const updateAudioStatus = () => {
    updateCurrentTime(audioRef.current.currentTime)
  }

  const onTrackEnd = () => {
    audioRef.current.currentTime = 0
    setIsPlaying(false)
  }

  return (
    <div className="conversationFooter">
      <div className="conversationPlayer">
        <SearchBox />
        <audio
          ref={audioRef}
          src={trackUrl}
          onTimeUpdate={updateAudioStatus}
          onLoadedData={getAudioData}
          onEnded={onTrackEnd}
        />
        <button
          title="Backward"
          className="backward"
          id="backward"
          data-icon="r"
          aria-label="backward"
          onClick={pause}
          type="button"
          style={{ marginTop: 9 }}
        />
        <button
          title="Play"
          style={{ display: isPlaying === true ? 'none' : 'block' }}
          className="play"
          id="play"
          data-icon="P"
          aria-label="play pause toggle"
          onClick={play}
          type="button"
        />
        <button
          title="Pause"
          style={{ display: isPlaying === true ? 'block' : 'none' }}
          className="play"
          id="pause"
          data-icon="u"
          aria-label="play pause toggle"
          onClick={pause}
          type="button"
        />
        <button
          title="Forward"
          className="forward"
          id="backward"
          data-icon="r"
          aria-label="backward"
          onClick={pause}
          type="button"
        />

        <ConversationTimer
          time={convertSecondsIntoReadableFormat(
            audioRef.current ? audioRef.current.currentTime : 0
          )}
        />
        <PlaybackSpeed />
      </div>
      <RecordButton isRecording={isRecording} />
    </div>
  )
}, React.createRef())

Player.propTypes = {
  trackId: PropTypes.string.isRequired,
  setTotalDurationOfTheAudio: PropTypes.string,
  currentTime: PropTypes.number,
  updateCurrentTime: PropTypes.func,
  isRecording: PropTypes.bool,
  audioRef: PropTypes.object.isRequired
}

export default Player
