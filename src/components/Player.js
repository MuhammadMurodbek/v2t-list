/* eslint-disable jsx-a11y/media-has-caption */
import React, { Component, Fragment } from 'react'
import '../styles/player.css'
import Seek from './Seek'

class Player extends Component {
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  state = {
    isPlaying: this.props.isPlaying,
    media: this.props.myref,
    trackDuration: null,
    seekPosition: 0,
    maxSeekValue: 100,
    startTimes: [],
    duration: 1
  }

  onChangeSeek = (e) => {
    const { value } = e.target
    const media = this.myRef.current
    media.currentTime = value
    this.setState({
      seekPosition: value
    })
  };

  playMusic = () => {
    const media = this.myRef && this.myRef.current ? this.myRef.current : null
    if (media !== null) {
      if (media.paused) {
        media.play()
        this.setState({ isPlaying: true })
      }
    }
  }

  pauseMusic = () => {
    const media = this.myRef && this.myRef.current ? this.myRef.current : null
    if (media !== null) {
      if (media.played) {
        media.pause()
        this.setState({ isPlaying: false })
      }
    }
  }

  stopMusic = () => {
    const media = this.myRef && this.myRef.current ? this.myRef.current : null
    if (media !== null) {
      media.pause()
      this.setState({ isPlaying: false }, () => {
        media.currentTime = 0
      })
    }
  }

  getAudioData = (e) => {
    const { duration } = e.target
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration - minutes * 60)
    const trackDuration = `${minutes}:${seconds}`
    const maxSeekValue = duration
    this.setState({ trackDuration, maxSeekValue, duration }, () => {
      this.updateTime()
    })
  }

  searchKeyword = (e) => {
    const { audioTranscript, queryTerm } = this.props
    const searchTerm = e ? e.target.value : queryTerm
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
            for (let j = 0; j < searchTermInit.length && (i + j) < singleWordObjectsWithoutEmptyChar.length; j += 1) {
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
    }, ()=>{
      this.props.updateSeek(this.state.seekPosition)
    })
  }


  render() {
    const {
      isPlaying, trackDuration, duration, currentTime, startTimes
    } = this.state
    const { audioTranscript, trackId, getCurrentTime } = this.props
    const trackUrl = `/api/v1/transcription/${trackId}/audio`
    return (
      <Fragment>
        <span>
          <input
            type="text"
            className="searchBox"
            placeholder="Search a keyword ..."
            onChange={this.searchKeyword}
          />
        </span>
        <audio
          ref={this.myRef}
          src={trackUrl}
          onTimeUpdate={getCurrentTime}
          onLoadedData={this.getAudioData}
        >
        Your browser does not support the
          <code>audio</code>
        element.
        </audio>
        <div className="controls">
          <button
            style={isPlaying === false ? { display: 'block' } : { display: 'none' }}
            className="play"
            data-icon="P"
            aria-label="play pause toggle"
            onClick={this.playMusic}
            type="button"
          />

          <button
            style={isPlaying === true ? { display: 'block' } : { display: 'none' }}
            className="play"
            data-icon="u"
            aria-label="play pause toggle"
            onClick={this.pauseMusic}
            type="button"
          />

          <button className="play" data-icon="S" aria-label="stop" onClick={this.stopMusic} type="button" />


            <input
              type="range"
              min="0"
              max={this.state.maxSeekValue.toString()}
              value={this.state.seekPosition}
              className="sliderWrapper"
              id="myRange"
              onChange={this.onChangeSeek}
            />
          <span aria-label="tidpunkt" className="tidPunkt">
            {this.myRef && this.myRef.current && currentTime ? currentTime : '--:-- '}
            /
            {this.myRef && this.myRef.current && trackDuration ? trackDuration : ' --:--'}
          </span>
        </div>

        <VirtualControl
          transcript={audioTranscript}
          startTimes={startTimes}
          duration={duration}
        />
      </Fragment>
    )
  }
}

const VirtualControl = ({ transcript, startTimes, duration }) => {
  if (!transcript) return null
  return (
    <div className="virtualControl">
      {transcript.map(({ segments }) => segments.map((segment, i ) => {
        if (startTimes.includes(segment.startTime)) {
          return (<Seek key={i} width={((segment.endTime - segment.startTime)) * 700 / duration} background="yellow" />)
        }
        return (<Seek key={i} width={((segment.endTime - segment.startTime)) * 700 / duration} background="black" />)
      }))}
    </div>
  )
}

export default Player
