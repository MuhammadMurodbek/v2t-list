import React, { Component } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui'
import Player from '../components/Player'
import Page from '../components/Page'
import '../styles/simple-player.css'

export default class UploadPage extends Component {
  state = {
    isMediaAudio: true,
    queryTerm: false
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Training ⛷'
    this.playerRef = React.createRef()
  }

  onTimeUpdate = () => {
    console.log('updated')
  }

  getCurrentTime = () => {
    this.playerRef.current.updateTime()
  }

  render() {
    const {
      isMediaAudio,
      queryTerm
    } = this.state

    return (
      <Page preferences title="Training">
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem grow={false}>
            <Player
            //   audioTranscript={originalChapters}
              trackId="b75d6cd4b7dd4727b32febd806d488c8"
              getCurrentTime={this.getCurrentTime}
              updateSeek={this.onTimeUpdate}
              queryTerm={queryTerm}
              isPlaying={false}
              isContentAudio={isMediaAudio}
              ref={this.playerRef}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}
