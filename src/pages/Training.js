import React, { Component } from 'react'
import axios from 'axios'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiTitle
} from '@elastic/eui'
import Player from '../components/Player'
import Editor from '../components/Editor'
import Page from '../components/Page'
import '../styles/simple-player.css'

export default class UploadPage extends Component {
  state = {
    isMediaAudio: true,
    queryTerm: false,
    isBeingEdited: false,
    chapters: [{
      keyword: 'Transcript',
      segments: [
        {
          endTime: 0,
          startTime: 0,
          words: 'Gott och opåverkad. Inga kardiella inkompensationstecken i vila. Pollenallergiker'
        }]
    }]
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

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
  }

  onSelectText = () => {
    const selctedText = window.getSelection().toString()
    this.setState({ queryTerm: selctedText }, () => {
      this.playerRef.current.searchKeyword()
    })
  }

  onUpdateTranscript = (chapters) => {
    this.setState({ chapters })
  }

  isBeingEdited = (editStatus) => {
    console.log('focusing')
    if (editStatus) {
      this.setState({ isBeingEdited: true })
    } else {
      this.setState({ isBeingEdited: false })
    }
  }

  completeTranscript = () => {
    // TODO
    // Mark the transcript as complete
    // Redirect to the next incomplete one
    // If there is none, congratulate the user
  }

  skipTranscript = () => {
    // TODO
    // Redirect to the next incomplete one
    // If there is none, let the user know that it is the last one to be completed
  }

  rejectTranscript = () => {
    // TODO
    // Redirect to the next incomplete one
    // If there is none, congratulate the user
  }


  onValidateTranscript = (errors) => {
    this.setState({ errors })
  }


  render() {
    const {
      isMediaAudio,
      queryTerm,
      chapters,
      currentTime,
      isBeingEdited
    } = this.state

    return (
      <Page preferences>
        <EuiTitle size="l">
          <h1>Training</h1>
        </EuiTitle>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem>
            <Player
            //   audioTranscript={originalChapters}
              trackId="24453e3d-d473-47f5-b7be-74d2c8ba8f37"
              getCurrentTime={this.getCurrentTime}
              updateSeek={this.onTimeUpdate}
              queryTerm={queryTerm}
              isPlaying={false}
              isContentAudio={isMediaAudio}
              ref={this.playerRef}
              isBeingEdited={isBeingEdited}
              searchBoxVisible={false}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup>
          <EuiFlexItem>
            <Editor
              transcript={chapters}
              originalChapters={chapters}
              chapters={chapters}
              currentTime={currentTime}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              validateTranscript={this.onValidateTranscript}
              isBeingEdited={this.isBeingEdited}
              isDiffVisible={false}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xl" />
        <EuiFlexGroup style={chapters.length !== 0 ? { display: 'flex' } : { display: 'none' }}>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="secondary" onClick={this.completeTranscript}>Complete</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton color="warning" onClick={this.skipTranscript}>Skip</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="danger" onClick={this.rejectTranscript}>Reject</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}
