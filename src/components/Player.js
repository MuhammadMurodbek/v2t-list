/* eslint-disable jsx-a11y/media-has-caption */
import React, { Component, Fragment } from 'react'
import {
  EuiGlobalToastList, EuiText, EuiSpacer, EuiToolTip
} from '@elastic/eui'
import '../styles/player.css'
import Seek from './Seek'

import { PreferenceContext } from './PreferencesProvider'

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
    currentVolumeLevel: 0.6,
    currentPlaybackRate: 1.0,
    toasts: []
  }

  componentDidMount = () => {
    document.addEventListener('keydown', this.handleKeyPress)
  }

  onChangeSeek = (e) => {
    const { duration } = this.state
    const { value } = e.target
    const media = this.myRef.current
    media.currentTime = value * duration / 100
    this.setState({
      seekPosition: media.currentTime
    })
  };

  playMusic = () => {
    if (this.myRef && this.myRef.current) {
      if (this.myRef.current.paused) {
        this.myRef.current.play()
        this.setState({ isPlaying: true })
      }
    }
  }

  pauseMusic = () => {
    if (this.myRef && this.myRef.current) {
      if (this.myRef.current.played) {
        this.myRef.current.pause()
        this.setState({ isPlaying: false })
      }
    }
    this.props.onPause()
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
    this.pauseMusic()
    const { mediaSkipDuration } = this.state
    if (this.myRef && this.myRef.current) {
      this.myRef.current.currentTime -= mediaSkipDuration
    }
  }

  forwardMusic = () => {
    this.pauseMusic()
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
      this.setState({ currentPlaybackRate: 1.0 })
      if (preferences.autoPlayStatus) {
        const media = this.myRef && this.myRef.current ? this.myRef.current : null
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
        const startTimes = audioTranscript.flatMap(({ segments }) => {
          const text = segments.map(segment => segment.words).join('')
          return text.includes(searchTerm) ? this.getSelectedSegments(searchTerm) : null
        }).filter(time => time)
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
          for (let i = 1; i < searchTermInit.length && (j + i) < singleWordObj.length; i += 1) {
            if (singleWordObj[j + i].word !== searchTermInit[i]) {
              patternFound = false
            }
          }
          if (patternFound === true) primarySegments.push(singleWordObj.startTime)
        }
      })

      const finale = []

      const singleWordObjectsWithoutEmptyChar = singleWordObjects.filter((singleWordObject) => {
        return singleWordObject.word !== ''
      })

      // Start pruning from here
      for (let i = 0; i < singleWordObjectsWithoutEmptyChar.length; i += 1) {
        if (primarySegments.includes(singleWordObjectsWithoutEmptyChar[i].startTime)) {
          // Start matching
          if (searchTermInit[0] === singleWordObjectsWithoutEmptyChar[i].word) {
            let isMatched = true
            for (let j = 0;
              j < searchTermInit.length && (i + j) < singleWordObjectsWithoutEmptyChar.length;
              j += 1) {
              if (searchTermInit[j] !== singleWordObjectsWithoutEmptyChar[i + j].word) {
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
    this.setState({
      currentTime: formattedCurrentTime,
      isPlaying,
      seekPosition: currentTime
    }, () => {
      updateSeek(seekPosition)
    })
  }

  handleKeyPress = (e) => {
    const { isPlaying, currentVolumeLevel, currentPlaybackRate } = this.state
    const media = this.myRef && this.myRef.current ? this.myRef.current : null
    if (e.altKey && e.key === 'ArrowLeft') {
      this.backwardMusic()
    } else if (e.altKey && e.key === 'ArrowRight') {
      this.forwardMusic()
    } else if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault()
      let updatedCurrentVolume = currentVolumeLevel
      if (currentVolumeLevel !== 1) {
        updatedCurrentVolume = parseFloat((currentVolumeLevel + 0.20).toFixed(2))
      }
      this.setState({
        currentVolumeLevel: updatedCurrentVolume
      }, () => {
        media.volume = updatedCurrentVolume
        this.setState({
          toasts: [{
            title: 'Volume 📢',
            color: 'success',
            text: `${updatedCurrentVolume * 100}%`
          }]
        })
      })
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault()
      let updatedCurrentVolume = currentVolumeLevel
      if (currentVolumeLevel !== 0.00) {
        updatedCurrentVolume = parseFloat((currentVolumeLevel - 0.20).toFixed(2))
      }
      this.setState({
        currentVolumeLevel: updatedCurrentVolume
      }, () => {
        media.volume = updatedCurrentVolume
        if (updatedCurrentVolume !== 0) {
          this.setState({
            toasts: [{
              title: 'Volume 📢',
              color: 'success',
              text: `${updatedCurrentVolume * 100}%`
            }]
          })
        } else {
          this.setState({
            toasts: [{
              title: 'Volume 🔕',
              color: 'success',
              text: 'Muted'
            }]
          })
        }
      })
    } else if (e.shiftKey && e.key === 'ArrowUp') {
      e.preventDefault()
      // let updatedCurrentVolume = currentVolumeLevel
      let updatedPlaybackRate = currentPlaybackRate
      if (currentPlaybackRate !== 2) {
        updatedPlaybackRate = parseFloat((currentPlaybackRate + 0.20).toFixed(2))
      }
      this.setState({
        currentPlaybackRate: updatedPlaybackRate
      }, () => {
        media.playbackRate = currentPlaybackRate
        this.setState({
          toasts: [{
            title: 'Uppspelningshastighet',
            color: 'success',
            text: `${updatedPlaybackRate * 100}%`
          }]
        })
      })
    } else if (e.shiftKey && e.key === 'ArrowDown') {
      e.preventDefault()
      let updatedPlaybackRate = currentPlaybackRate
      if (currentPlaybackRate !== 0.2) {
        updatedPlaybackRate = parseFloat((currentPlaybackRate - 0.20).toFixed(2))
      }
      this.setState({
        currentPlaybackRate: updatedPlaybackRate
      }, () => {
        media.playbackRate = updatedPlaybackRate
        if (updatedPlaybackRate !== 0) {
          this.setState({
            toasts: [{
              title: 'Uppspelningshastighet',
              color: 'success',
              text: `${updatedPlaybackRate * 100}%`
            }]
          })
        }
      })
    } else if (e.altKey && e.keyCode === 32) {
      e.preventDefault()
      if (isPlaying) {
        this.pauseMusic()
      } else {
        this.playMusic()
      }
    }
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }

  render() {
    const {
      isPlaying, trackDuration, duration, currentTime, startTimes, seekPosition, toasts, currentPlaybackRate
    } = this.state
    const {
      audioTranscript,
      trackId,
      getCurrentTime,
      isContentAudio,
      searchBoxVisible,
      token
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
          <input
            type="text"
            className="searchBox"
            placeholder="Leta ord ..."
            onChange={this.searchKeyword}
          />
        </span>

        <audio
          ref={this.myRef}
          src={trackUrl}
          style={{ display: (preferences.showVideo && isContentAudio) === false ? 'block' : 'none' }}
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
          src={trackUrl}
          style={{ display: preferences.showVideo && !isContentAudio ? 'block' : 'none' }}
          className="videoPlayer"
          onTimeUpdate={getCurrentTime}
          onLoadedData={this.getAudioData}
        >
        Your browser does not support the
          <code>audio</code>
        element.
        </video>

        <div className="sticky-controls">
          <div className={preferences.stopButtonVisibilityStatus === false ? "controls" : "controlsWithStopButtonEnabled" }>
            <button
              title="Tryck alt+space för att spela"
              style={{ display: isPlaying === false ? 'block' : 'none' }}
              className="play"
              id="play"
              data-icon="P"
              aria-label="play pause toggle"
              onClick={this.playMusic}
              type="button"
            />

            <button
              title="Tryck alt+space för att pausa"
              style={{ display: isPlaying === true ? 'block' : 'none' }}
              className="play"
              id="pause"
              data-icon="u"
              aria-label="play pause toggle"
              onClick={this.pauseMusic}
              type="button"
            />

            <button
              title="Tryck alt+space för att sluta"
              style={{ display: preferences.stopButtonVisibilityStatus === true ? 'block' : 'none' }}
              className="play"
              id="stop"
              data-icon="S"
              aria-label="play pause toggle"
              onClick={this.stopMusic}
              type="button"
            />

            <button
              title="Tryck alt + → för att hoppa ett ord framåt"
              className="play"
              id="backward"
              data-icon="B"
              aria-label="stop"
              onClick={this.backwardMusic}
              type="button"
            />

            <button
              title="Tryck alt + ← för att hoppa ett ord bakåt"
              className="play"
              id="forward"
              data-icon="F"
              aria-label="stop"
              onClick={this.forwardMusic}
              type="button"
            />
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
              className={preferences.stopButtonVisibilityStatus === false ? "tidPunkt" : "tidPunktWithStopButtonEnabled"}
            >
              {this.myRef && this.myRef.current && currentTime ? currentTime : '--:-- '}
              &nbsp;/&nbsp;
              {this.myRef && this.myRef.current && trackDuration ? trackDuration : ' --:--'}
            </span>
            <EuiToolTip position="top" content="Tryck shift+↑ eller shift+↓ för att ändra hastigheten">
              <span
                aria-label="playbackSpeed"
                className="playbackSpeed"
              >
                {(Math.round(currentPlaybackRate * 100) / 100).toFixed(2)}x
            </span>
            </EuiToolTip>
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
        <EuiSpacer size="l" />
        <EuiText textAlign="left" className="tips">
          <span>Tryck alt+space för att </span>
          <span style={{ display: isPlaying === true ? 'inline-block' : 'none' }}>pausa</span>
          <span style={{ display: isPlaying === false ? 'inline-block' : 'none' }}>spela</span>
        </EuiText>
      </Fragment>
    )
  }
}

const VirtualControl = ({ transcript, startTimes, duration, preferences }) => {
  if (!transcript) return null
  return (
      <div className={preferences.stopButtonVisibilityStatus === false ? "virtualControl" : "virtualControlWithStopButtonEnabled"}>
      {transcript.map(({ segments }) => segments.map((segment, i) => {
        if (startTimes.includes(segment.startTime)) {
          return (<Seek key={i} width={((segment.endTime - segment.startTime)) * 700 / duration} background="yellow" />)
        }
        return (<Seek key={i} width={((segment.endTime - segment.startTime)) * 700 / duration} background="black" />)
      }))}
    </div>
  )
}

export default Player
