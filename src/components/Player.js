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
    trackDurationNumeric: 1
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
    const { audioTranscript } = this.props
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration - minutes * 60)
    const trackDuration = `${minutes}:${seconds}`
    const maxSeekValue = duration
    this.setState({ trackDuration, maxSeekValue, trackDurationNumeric: duration }, () => {
      this.updateTime()
    })
  }

  searchKeyword = (e) => {
    const keyword = e.target.value
    const { audioTranscript } = this.props
    const { segments } = audioTranscript
    const startTimes = []
    if (keyword.length > 0) {
      segments.map((segment) => {
        if (segment.words.length !== 0 && segment.words.includes(keyword)) {
          startTimes.push(segment.startTime)
        }
      })
    }
    this.setState({ startTimes })
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
      isPlaying, trackDuration, trackDurationNumeric, currentTime, startTimes
    } = this.state
    const { audioTranscript, trackId, getCurrentTime } = this.props
    const trackUrl = `http://localhost:6106/api/v1/transcription/${trackId}/audio`
    let seekBar
    

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
              {/* <span aria-label="timer" className="seekBar" /> */}
              <span aria-label="tidpunkt" className="tidPunkt">
                {this.myRef && this.myRef.current ? currentTime : '--:--'}
                /
              {this.myRef && this.myRef.current ? trackDuration : '--:--'}
              </span>
        </div>

        <div className="virtualControl">
          {audioTranscript.segments.map((segment) => {
            if (startTimes.includes(segment.startTime)) {
              return (<Seek width={((segment.endTime - segment.startTime)) * 700 / trackDurationNumeric} background="yellow" />)
            }
            return (<Seek width={((segment.endTime - segment.startTime)) * 700 / trackDurationNumeric} background="black" />)
          })}
        </div> 
      </Fragment>
    )
  }
}

export default Player
