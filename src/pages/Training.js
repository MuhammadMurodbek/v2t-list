import React, { Component, Fragment } from 'react'
import axios from 'axios'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiTitle,
  EuiGlobalToastList,
  EuiProgress
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
    }],
    trasncriptId: null,
    toasts: []
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Training ⛷'
    this.playerRef = React.createRef()
    this.loadCurrentTranscript()
  }

  loadCurrentTranscript = async () => {
    const status = await axios.get('/api/v1/training/')
    if (Object.prototype.hasOwnProperty.call(status, 'transcription')) {
      this.setState({
        trasncriptId: status.transcription.transcriptionId
      })
    } else {
      // alert('Yayyyy, all transcripts have feedback now')
    }
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

  completeTranscript = async () => {
    // const status = await axios.get('/api/v1/training/')
    // console.log('status')
    // console.log(status)
    this.setState({
      toasts: [{
        title: '',
        color: 'success',
        text: (
          <Fragment>
            <h3>Saving training data</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    })
  }

  skipTranscript = () => {
    // TODO
    // Redirect to the next incomplete one
    // If there is none, let the user know that it is the last one to be completed
    this.setState({
      toasts: [{
        title: '',
        color: 'primary',
        text: (
          <Fragment>
            <h3>Loading new training data</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    })
    this.loadCurrentTranscript()
  }

  rejectTranscript = async () => {
    // const { trasncriptId, chapters } = this.state
    // let trainingText = ''
    // chapters.forEach((chapter) => {
    //   trainingText = `${trainingText} ${chapter.segment}`
    // })

    // const rejectionStatus = await axios.post(`/api/v1/training/${trasncriptId}/0/0`, {
    //   text: trainingText,
    //   status: 'REJECT'
    // })

    this.setState({
      toasts: [{
        title: '',
        color: 'danger',
        text: (
          <Fragment>
            <h3>Rejecting training data</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    })

    // if (rejectionStatus) {
    //   alert('The training data is marked as rejected.')
    //   window.location.replace('/training')
    // }
  }


  onValidateTranscript = (errors) => {
    this.setState({ errors })
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }


  render() {
    const {
      isMediaAudio,
      queryTerm,
      chapters,
      currentTime,
      isBeingEdited,
      trasncriptId,
      toasts
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
              trackId={trasncriptId}
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
        <EuiGlobalToastList
          toasts={toasts}
          dismissToast={this.removeToast}
          toastLifeTimeMs={2000}
        />
      </Page>
    )
  }
}
