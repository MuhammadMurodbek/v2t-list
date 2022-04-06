/* eslint-disable react/prop-types */
import React, { Component, Fragment } from 'react'
import {
  EuiGlobalToastList,
  EuiToolTip,
  EuiFieldSearch,
  EuiSelect
} from '@elastic/eui'
import '../styles/player.css'
import Seek from './Seek'

import { PreferenceContext } from './PreferencesProvider'
import { EuiI18n } from '@elastic/eui'
import Mic from '../components/Mic'
import { EVENTS } from '../components/EventHandler'
import EventEmitter from '../models/events'
import { sleep } from '../utils'

class Player extends Component {
  static contextType = PreferenceContext

  constructor(props) {
    super(props)
    this.myRef = React.createRef()
    this.isRewinding = false
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
    toasts: [],
    options: [],
    micValue: ''
  }
 
  componentDidMount = () => {
    const { mic } = this.props
    EventEmitter.subscribe(EVENTS.TOGGLE_PLAY, this.togglePlay)
    EventEmitter.subscribe(EVENTS.PLAY_AUDIO, this.playAudio)
    EventEmitter.subscribe(EVENTS.PAUSE_AUDIO, this.pauseAudio)
    EventEmitter.subscribe(EVENTS.VOLUMEUP, this.volumeUp)
    EventEmitter.subscribe(EVENTS.VOLUMEDOWN, this.volumeDown)
    EventEmitter.subscribe(EVENTS.PLAYBACKUP, this.playbackSpeedUp)
    EventEmitter.subscribe(EVENTS.PLAYBACKDOWN, this.playbackSpeedDown)
    EventEmitter.subscribe(EVENTS.STOP_AUDIO, this.stopAudio)
    EventEmitter.subscribe(EVENTS.BACKWARD_AUDIO, this.backwardAudio)
    EventEmitter.subscribe(EVENTS.FORWARD_AUDIO, this.forwardAudio)
    EventEmitter.subscribe(EVENTS.FAST_FORWARD_AUDIO, this.fastForwardAudio)
    EventEmitter.subscribe(EVENTS.REWIND_AUDIO, this.rewindAudio)

    if (mic) {
      navigator.mediaDevices.enumerateDevices()
        .then(this.gotDevices)
        .then(this.startMic)
        .catch(this.handleError)
    }
  }

  componentWillUnmount = () => {
    EventEmitter.unsubscribe(EVENTS.TOGGLE_PLAY, this.togglePlay)
    EventEmitter.unsubscribe(EVENTS.PLAY_AUDIO, this.playAudio)
    EventEmitter.unsubscribe(EVENTS.PAUSE_AUDIO, this.pauseAudio)
    EventEmitter.unsubscribe(EVENTS.VOLUMEUP, this.volumeUp)
    EventEmitter.unsubscribe(EVENTS.VOLUMEDOWN, this.volumeDown)
    EventEmitter.unsubscribe(EVENTS.PLAYBACKUP, this.playbackSpeedUp)
    EventEmitter.unsubscribe(EVENTS.PLAYBACKDOWN, this.playbackSpeedDown)
    EventEmitter.unsubscribe(EVENTS.STOP_AUDIO, this.stopAudio)
    EventEmitter.unsubscribe(EVENTS.BACKWARD_AUDIO, this.backwardAudio)
    EventEmitter.unsubscribe(EVENTS.FORWARD_AUDIO, this.forwardAudio)
    EventEmitter.unsubscribe(EVENTS.FAST_FORWARD_AUDIO, this.fastForwardAudio)
    EventEmitter.unsubscribe(EVENTS.REWIND_AUDIO, this.rewindAudio)
  }

  componentDidUpdate = (prevProps, prevState) => {
    const { cursorTime, mic } = this.props
    const { isPlaying } = this.state
    const { micValue } = this.state
    if (!isPlaying && prevProps.cursorTime !== cursorTime) {
      this.myRef.current.currentTime = cursorTime
    }
    if(prevState.micValue !== micValue && mic) {
      this.startMic()
    }
  }

  gotDevices = (deviceInfos) => {
    const { options } = this.state
    for (let i = 0; i < deviceInfos.length; i++) {
      const deviceInfo = deviceInfos[i]
      const option = {
        value: deviceInfo.deviceId
      }
      if (deviceInfo.kind === 'audioinput') {
        option.text = deviceInfo.label || 
        `microphone ${options.length + 1}`
        options.push(option)
        this.setState({ micValue: options[0].value })
      }
    }
  }

  startMic = () => {
    const { micValue } = this.state
    if (window.stream) {
      window.stream.getAudioTracks()[0].stop()
    }
    const audioSource = micValue
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined } 
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => window.stream = stream).catch(this.handleError)
  }

  handleError = (error) => {
    // eslint-disable-next-line no-console
    console.log(error.message)
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
    if (this.isRewinding) this.isRewinding = false
    const { isPlaying } = this.state
    if (isPlaying)
      this.pauseAudio()
    else
      this.playAudio()
  }

  playAudio = () => {
    const { playbackRate, volume } = this.state
    if (this.myRef && this.myRef.current) {
      if(volume===0 && playbackRate!==1) {
        this.myRef.current['volume'] = 1
      }
      if (playbackRate!==1) {
        this.myRef.current.playbackRate = 1
        this.setState({ playbackRate: 1 })
      }
      if (!this.myRef || !this.myRef.current) return
      this.myRef.current.play().catch(e => {
        console.error(e)
      })
      this.setState({ isPlaying: true })
    }
  }

  pauseAudio = () => {
    if (!this.myRef || !this.myRef.current) return
    this.myRef.current.pause()
    this.setState({ isPlaying: false })
    this.props.onPause(
      this.myRef && this.myRef.current && this.myRef.current.currentTime
    )
  }

  stopAudio = () => {
    if (this.myRef && this.myRef.current) {
      this.myRef.current.pause()
      this.setState({ isPlaying: false }, () => {
        this.myRef.current.currentTime = 0
      })
    }
  }

  backwardAudio = () => {
    this.pauseAudio()
    const { mediaSkipDuration } = this.state
    if (this.myRef && this.myRef.current) {
      this.myRef.current.currentTime -= mediaSkipDuration
    }
  }

  forwardAudio = () => {
    this.pauseAudio()
    const { mediaSkipDuration } = this.state
    if (this.myRef && this.myRef.current) {
      this.myRef.current.currentTime += mediaSkipDuration
    }
  }

  // `alt + s` or `option + S` in mac
  fastForwardAudio = () => {
    if (this.myRef && this.myRef.current) {
      if (this.state.isPlaying && this.state.playbackRate!==1) {
        this.pauseAudio()
        if (this.myRef) {
          this.myRef.current['volume'] = 1
          this.setState({ volume: 1 })
        }
        return
      } else {
        if (this.myRef) {
          this.myRef.current['volume'] = 0
          this.setState({ volume: 0 })
        }
        this.playAudio()
      }
      this.isRewinding = false
      if (this.myRef && this.myRef.current) {
        this.increasePlaybackRate(true, 5)
      }
    }
  }

  // `alt + r` or `option + R` in mac
  rewindAudio = async () => {
    if (this.myRef && this.myRef.current) {
      if (this.isRewinding) {
        this.isRewinding = false
        this.pauseAudio()
        this.myRef.current.playbackRate = 1
        this.setState({ playbackRate: 1 })
        return
      }
      this.isRewinding = true
      while (this.isRewinding && this.myRef.current.currentTime > 0.5) {
        this.myRef.current.currentTime -= 1
        if (this.myRef.current.currentTime <= 0){ // pause when it hits 0
          this.pauseAudio()
        }
        await sleep(100)
      }
    }
  }

  getAudioData = (e) => {
    const { duration } = e.target
    const { preferences } = this.context
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
        this.setState({ startTimes: []})
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

  increasePlaybackRate = (shouldIncreasePlaybackRate, rate = 0.2) => {
    const change = shouldIncreasePlaybackRate ? rate : -1 * rate
    const { playbackRate } = this.state
    const title = () => 'Uppspelningshastighet'
    const text = (v) => `${v * 100}%`
    this.updateMedia('playbackRate', title, text, 0.2, 5, playbackRate, change)
  }

  playbackSpeedUp = () => {
    this.increasePlaybackRate(true)
  }

  playbackSpeedDown = () => {
    this.increasePlaybackRate(false)
  }

  removeToast = () => {
    this.setState({ toasts: []})
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
      playbackRate,
      options,
      micValue
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
      toggleRecord,
      isTraining
    } = this.props

    const { preferences } = this.context
    let trackUrl = ''
    if (trackId){
      trackUrl = isTraining
        ? `/api/training/v2/transcript/${trackId}/media?_token=${token}`
        : `/api/transcription/v2/${trackId}/media?_token=${token}`
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
            display:
              preferences.showVideo && !isContentAudio ? 'block' : 'none'
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
            className={`${
              preferences.stopButtonVisibilityStatus === false
                ? 'controls'
                : 'controlsWithStopButtonEnabled'
            } ${mic ? 'micS' : ''}`}
          >
            <EuiI18n
              tokens={[
                'press',
                'toQuit',
                'toJumpAWordForward',
                'toJumpAWordBackward',
                'toToggle'
              ]}
              defaults={[
                'Press',
                'to stop',
                'to jump a word forward',
                'to jump a word backwards',
                'to toggle'
              ]}
            >
              {([
                press,
                toQuit,
                toJumpAWordForward,
                toJumpAWordBackward,
                toToggle
              ]) => (
                <>
                  <button
                    title={`${press} 'alt+p' ${toToggle}`}
                    style={{ display: isPlaying === false ? 'block' : 'none' }}
                    className="play"
                    id="play"
                    data-icon="P"
                    aria-label="play pause toggle"
                    onClick={this.playAudio}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt+p' ${toToggle}`}
                    style={{ display: isPlaying === true ? 'block' : 'none' }}
                    className="play"
                    id="pause"
                    data-icon="u"
                    aria-label="play pause toggle"
                    onClick={this.pauseAudio}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt+d' ${toQuit}`}
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
                    onClick={this.stopAudio}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt + ←' ${toJumpAWordBackward}`}
                    className="play"
                    id="backward"
                    data-icon="B"
                    aria-label="stop"
                    onClick={this.backwardAudio}
                    type="button"
                  />

                  <button
                    title={`${press} 'alt + →' ${toJumpAWordForward}`}
                    className="play"
                    id="forward"
                    data-icon="F"
                    aria-label="stop"
                    onClick={this.forwardAudio}
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
                  content={`${press} 'alt+k' ${or} 'alt+m' ${toChangeTheSpeed}`}
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
        {mic ? 
          <div style={{ marginTop: '20px' }}>
            <EuiSelect
              options={options}
              value={micValue}
              onChange={(e) => this.setState({ micValue: e.target.value })}
            />
          </div>
          : null}
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
