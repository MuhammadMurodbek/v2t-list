/* eslint-disable jsx-a11y/media-has-caption */
import React, { Component, Fragment } from 'react'
import {
  EuiGlobalToastList,
  EuiToolTip,
  EuiFieldSearch
} from '@patronum/eui'
import '../styles/player.css'
import Seek from './Seek'

import { PreferenceContext } from './PreferencesProvider'
import { EuiI18n } from '@patronum/eui'
import Mic from '../components/Mic'
import { EVENTS } from '../components/EventHandler'
import EventEmitter from "../models/events"

class Player extends Component {
  static contextType = PreferenceContext

  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  state = {
    isPlaying: this.props.isPlaying,
    trackDuration: null,
    seekPosition: 0,
    startTimes: [],
    duration: 1,
    mediaSkipDuration: 2,
    volume: 0.6,
    playbackRate: 1.0,
    toasts: []
  }

  componentDidMount = () => {
    EventEmitter.subscribe(EVENTS.TOGGLE_PLAY, this.togglePlay)
    EventEmitter.subscribe(EVENTS.VOLUMEUP, this.volumeUp)
    EventEmitter.subscribe(EVENTS.VOLUMEDOWN, this.volumeDown)
    EventEmitter.subscribe(EVENTS.PLAYBACKUP, this.playbackSpeedUp)
    EventEmitter.subscribe(EVENTS.PLAYBACKDOWN, this.playbackSpeedDown)
  }

  componentWillUnmount = () => {
    EventEmitter.unsubscribe(EVENTS.TOGGLE_PLAY, this.togglePlay)
    EventEmitter.unsubscribe(EVENTS.VOLUMEUP, this.volumeUp)
    EventEmitter.unsubscribe(EVENTS.VOLUMEDOWN, this.volumeDown)
    EventEmitter.unsubscribe(EVENTS.PLAYBACKUP, this.playbackSpeedUp)
    EventEmitter.unsubscribe(EVENTS.PLAYBACKDOWN, this.playbackSpeedDown)
  }

  componentDidUpdate = (prevProps) => {
    const { cursorTime } = this.props
    const { isPlaying } = this.state
    if (!isPlaying && prevProps.cursorTime !== cursorTime)
      this.myRef.current.currentTime = cursorTime
  }

  onChangeSeek = (e) => {
    const { duration } = this.state
    const { value } = e.target
    const media = this.myRef.current
    media.currentTime = (value * duration) / 100
    this.setState({
      seekPosition: media.currentTime
    })
  }

  togglePlay = () => {
    const { isPlaying } = this.state
    if (isPlaying)
      this.pauseAudio()
    else
      this.playAudio()
  }

  playAudio = () => {
    if (!this.myRef || !this.myRef.current) return
    this.myRef.current.play().catch(e => {
      console.log(e);
    })
    this.setState({ isPlaying: true })
  }

  pauseAudio = () => {
    if (!this.myRef || !this.myRef.current) return
    this.myRef.current.pause()
    this.setState({ isPlaying: false })
    this.props.onPause(this.myRef && this.myRef.current && this.myRef.current.currentTime)
  }

  stopMusic = () => {
    if (this.myRef && this.myRef.current) {
      this.myRef.current.pause()
      this.setState({ isPlaying: false }, () => {
        this.myRef.current.currentTime = 0
      })
    }
  }

  backwardMusic = () => {
    pauseAudio()
    const { mediaSkipDuration } = this.state
    if (this.myRef && this.myRef.current) {
      this.myRef.current.currentTime -= mediaSkipDuration
    }
  }

  forwardMusic = () => {
    pauseAudio()
    const { mediaSkipDuration } = this.state
    if (this.myRef && this.myRef.current) {
      this.myRef.current.currentTime += mediaSkipDuration
    }
  }

  getAudioData = (e) => {
    const { duration } = e.target
    const [preferences] = this.context
    let minutes = Math.floor(duration / 60)
    minutes = minutes < 10 ? `0${minutes}` : minutes
    let seconds = Math.floor(duration - minutes * 60)
    seconds = seconds < 10 ? `0${seconds}` : seconds
    const trackDuration = `${minutes}:${seconds}`
    this.setState({ trackDuration, duration }, () => {
      this.setState({ playbackRate: 1.0 })
      if (preferences.autoPlayStatus) {
        const media =
          this.myRef && this.myRef.current ? this.myRef.current : null
        media.play()
      }
      this.updateTime()
    })
  }

  searchKeyword = (e) => {
    const { audioTranscript, queryTerm, searchBoxVisible } = this.props
    const searchTerm = e ? e.target.value : queryTerm
    if (searchBoxVisible) {
      if (searchTerm.length > 0) {
        const startTimes = audioTranscript
          .flatMap(({ segments }) => {
            const text = segments.map((segment) => segment.words).join('')
            return text.includes(searchTerm)
              ? this.getSelectedSegments(searchTerm)
              : null
          })
          .filter((time) => time)
        this.setState({ startTimes })
      } else {
        this.setState({ startTimes: [] })
      }
    }
  }

  getSelectedSegments = (searchTerm) => {
    const { audioTranscript } = this.props
    return audioTranscript.flatMap(({ segments }) => {
      const primarySegments = []
      const searchTermInit = searchTerm.split(' ')
      const singleWordObjects = []
      segments.map((segment) => {
        const words = segment.words.split(' ')
        words.map((word) => {
          const nyObj = {}
          nyObj.word = word
          nyObj.startTime = segment.startTime
          nyObj.endTime = segment.endTime
          singleWordObjects.push(nyObj)
          return true
        })
        return true
      })

      singleWordObjects.forEach((singleWordObj, j) => {
        let patternFound = true
        if (singleWordObj.word.includes(searchTermInit[0])) {
          for (
            let i = 1;
            i < searchTermInit.length && j + i < singleWordObj.length;
            i += 1
          ) {
            if (singleWordObj[j + i].word !== searchTermInit[i]) {
              patternFound = false
            }
          }
          if (patternFound === true)
            primarySegments.push(singleWordObj.startTime)
        }
      })

      const finale = []

      const singleWordObjectsWithoutEmptyChar = singleWordObjects.filter(
        (singleWordObject) => {
          return singleWordObject.word !== ''
        }
      )

      // Start pruning from here
      for (let i = 0; i < singleWordObjectsWithoutEmptyChar.length; i += 1) {
        if (
          primarySegments.includes(
            singleWordObjectsWithoutEmptyChar[i].startTime
          )
        ) {
          // Start matching
          if (searchTermInit[0] === singleWordObjectsWithoutEmptyChar[i].word) {
            let isMatched = true
            for (
              let j = 0;
              j < searchTermInit.length &&
              i + j < singleWordObjectsWithoutEmptyChar.length;
              j += 1
            ) {
              if (
                searchTermInit[j] !==
                singleWordObjectsWithoutEmptyChar[i + j].word
              ) {
                isMatched = false
              }
            }

            if (isMatched === true) {
              finale.push(singleWordObjectsWithoutEmptyChar[i].startTime)
            }
          }
        }
      }
      const finaleUnique = Array.from(new Set(finale))
      return finaleUnique
    })
  }

  updateTime = () => {
    const media = this.myRef.current
    const { currentTime } = media
    const { seekPosition } = this.state
    const { updateSeek } = this.props
    const isPlaying = media.paused === false
    let minutes = Math.floor(currentTime / 60)
    let seconds = Math.floor(currentTime - minutes * 60)
    if (minutes < 10) minutes = `0${minutes}`
    if (seconds < 10) seconds = `0${seconds}`
    const formattedCurrentTime = `${minutes}:${seconds}`
    this.setState(
      {
        currentTime: formattedCurrentTime,
        isPlaying,
        seekPosition: currentTime
      },
      () => {
        updateSeek(seekPosition)
      }
    )
  }

  updateMedia = (setting, title, text, min, max, current, change) => {
    const media = this.myRef && this.myRef.current ? this.myRef.current : null
    const value = Math.max(min, Math.min(max, current + change).toFixed(2))
    media[setting] = value
    this.setState({
      [setting]: value,
      toasts: [
        {
          id: `toast-${setting}`,
          title: title(value),
          color: 'success',
          text: text(value)
        }
      ]
    })
  }

  alterVolume = (change) => {
    const { volume } = this.state
    const title = (v) => `Volume ${v ? '📢' : '🔕'}`
    const text = (v) => (v ? `${v * 100}%` : 'Muted')
    this.updateMedia('volume', title, text, 0, 1, volume, change)
  }

  volumeUp = () => { this.alterVolume(0.2) }

  volumeDown = () => { this.alterVolume(-0.2) }

  increasePlaybackRate = (shouldIncreasePlaybackRate) => {
    const change = shouldIncreasePlaybackRate ? 0.2 : -0.2
    const { playbackRate } = this.state
    const title = (v) => 'Uppspelningshastighet'
    const text = (v) => `${v * 100}%`
    this.updateMedia('playbackRate', title, text, 0.2, 2, playbackRate, change)
  }

  playbackSpeedUp = () => {
    this.increasePlaybackRate(true)
  }

  playbackSpeedDown = () => {
    this.increasePlaybackRate(false)
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }

  render() {
    const {
      isPlaying,
      trackDuration,
      duration,
      currentTime,
      startTimes,
      seekPosition,
      toasts,
      playbackRate
    } = this.state
    const {
      audioTranscript,
      audioClip,
      trackId,
      getCurrentTime,
      isContentAudio,
      searchBoxVisible,
      token,
      mic,
      recording,
      recordedTime,
      toggleRecord
    } = this.props

    const [preferences] = this.context
    let trackUrl = `/api/transcriptions/v1/${trackId}/media`
    const isTraining = this.props
    if (isTraining) {
      trackUrl = `/api/training/v2/transcript/${trackId}/media?_token=${token}`
    }
    return (
      <Fragment>
        <span style={{ display: searchBoxVisible ? 'flex' : 'none' }}>
          <EuiI18n token="search" default="Search">
            {(translation) => (
              <EuiFieldSearch
                placeholder={`${translation}...`}
                onChange={this.searchKeyword}
              />
            )}
          </EuiI18n>
        </span>

        <audio
          ref={this.myRef}
          src={audioClip ? audioClip.src : trackUrl}
          onTimeUpdate={getCurrentTime}
          onLoadedData={this.getAudioData}
        >
          Your browser does not support the
          <code>audio</code>
          element.
        </audio>

        <video
          width="500"
          height="500"
          ref={this.myRef}
          src={audioClip ? audioClip.src : trackUrl}
          style={{
            display: preferences.showVideo && !isContentAudio ? 'block' : 'none'
          }}
          className="videoPlayer"
          onTimeUpdate={getCurrentTime}
          onLoadedData={this.getAudioData}
        >
          Your browser does not support the
          <code>video</code>
          element.
        </video>

        <div className="sticky-controls">
          <div
            className={
              `${preferences.stopButtonVisibilityStatus === false
                ? 'controls' : 'controlsWithStopButtonEnabled'} ${mic ? 'micS' : ''}`
            }
          >
            <EuiI18n
              tokens={[
                'press',
                'toPlay',
                'toPause',
                'toQuit',
                'toJumpAWordForward',
                'toJumpAWordBackward'
              ]}
              defaults={[
                'Press',
                'to play',
                'to pause',
                'to quit',
                'to jump a word forward',
                'to jump a word backwards'
              ]}
            >
              {([
                press,
                toPlay,
                toPause,
                toQuit,
                toJumpAWordForward,
                toJumpAWordBackward
              ]) => (
                <>
                  <button
                    title={`${press} 'alt+p' ${toPlay}`}
                    style={{ display: isPlaying === false ? 'block' : 'none' }}
                    className="play"
                    id="play"
                    data-icon="P"
                    aria-label="play pause toggle"
                    onClick={this.togglePlay}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt+p' ${toPause}`}
                    style={{ display: isPlaying === true ? 'block' : 'none' }}
                    className="play"
                    id="pause"
                    data-icon="u"
                    aria-label="play pause toggle"
                    onClick={this.togglePlay}
                    type="button"
                  />

                  <button
                    title={`${press} ${toQuit}`}
                    style={{
                      display:
                        preferences.stopButtonVisibilityStatus === true
                          ? 'block'
                          : 'none'
                    }}
                    className="play"
                    id="stop"
                    data-icon="S"
                    aria-label="play pause toggle"
                    onClick={this.stopMusic}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt + ←' ${toJumpAWordBackward}`}
                    className="play"
                    id="backward"
                    data-icon="B"
                    aria-label="stop"
                    onClick={this.backwardMusic}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt + →' ${toJumpAWordForward}`}
                    className="play"
                    id="forward"
                    data-icon="F"
                    aria-label="stop"
                    onClick={this.forwardMusic}
                    type="button"
                  />
                </>
              )}
            </EuiI18n>
            <input
              type="range"
              min="0"
              max="100"
              value={(seekPosition / duration) * 100}
              className="sliderWrapper"
              id="myRange"
              onChange={this.onChangeSeek}
            />
            <span
              aria-label="tidpunkt"
              className={
                preferences.stopButtonVisibilityStatus === false
                  ? 'tidPunkt'
                  : 'tidPunktWithStopButtonEnabled'
              }
            >
              {this.myRef && this.myRef.current && currentTime
                ? currentTime
                : '--:-- '}
              &nbsp;/&nbsp;
              {this.myRef && this.myRef.current && trackDuration
                ? trackDuration
                : ' --:--'}
            </span>
            <EuiI18n
              tokens={['press', 'or', 'toChangeTheSpeed']}
              defaults={['Press', 'or', 'to change the speed']}
            >
              {([press, or, toChangeTheSpeed]) => (
                <EuiToolTip
                  position="top"
                  content={`${press} 'shift+↑' ${or} 'shift+↓' ${toChangeTheSpeed}`}
                >
                  <span aria-label="playbackSpeed" className="playbackSpeed">
                    {(Math.round(playbackRate * 100) / 100).toFixed(2)}x
                  </span>
                </EuiToolTip>
              )}
            </EuiI18n>
            <Mic
              visible={mic}
              microphoneBeingPressed={recording}
              toggleRecord={toggleRecord}
              seconds={recordedTime}
            />
          </div>
          <VirtualControl
            transcript={audioTranscript}
            startTimes={startTimes}
            duration={duration}
            preferences={preferences}
          />
        </div>
        <EuiGlobalToastList
          toasts={toasts}
          dismissToast={this.removeToast}
          toastLifeTimeMs={2000}
        />
      </Fragment>
    )
  }
}

const VirtualControl = ({ transcript, startTimes, duration, preferences }) => {
  if (!transcript) return null
  return (
    <div
      className={
        preferences.stopButtonVisibilityStatus === false
          ? 'virtualControl'
          : 'virtualControlWithStopButtonEnabled'
      }
    >
      {transcript.map(({ segments }) =>
        segments.map((segment, i) => {
          if (startTimes.includes(segment.startTime)) {
            return (
              <Seek
                key={i}
                width={((segment.endTime - segment.startTime) * 700) / duration}
                background="yellow"
              />
            )
          }
          return (
            <Seek
              key={i}
              width={((segment.endTime - segment.startTime) * 700) / duration}
              background="black"
            />
          )
        })
      )}
    </div>
  )
}

export default Player
