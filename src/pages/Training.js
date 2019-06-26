import React, { Component, Fragment } from 'react'
import axios from 'axios'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiTitle,
  EuiGlobalToastList,
  EuiProgress,
  EuiAvatar, EuiTextAlign, EuiIcon,
  EuiImage
} from '@elastic/eui'
import Player from '../components/Player'
import Editor from '../components/Editor'
import Page from '../components/Page'
import TrainingInstructions from '../components/TrainingInstructions'
import TrainingButtonActions from '../components/TrainingButtonActions'
import '../styles/simple-player.css'

export default class UploadPage extends Component {
  state = {
    isMediaAudio: true,
    queryTerm: false,
    chapters: [],
    transcriptionId: 0,
    toasts: [],
    incompleteTranscriptExists: true
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Training ⛷'
    this.playerRef = React.createRef()
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
    }, () => {
      this.loadCurrentTranscript()
    })
  }

  loadCurrentTranscript = async () => {
    const status = await axios.get('/api/v1/training/')
    console.log('status')
    console.log(status)
    if (status.data.transcription) {
      this.setState({
        transcriptionId: status.data.transcription.transcriptionId
      }, () => {
        this.loadSubtitle(status)
      })
    } else {
      // alert('Yayyyy, all transcripts have feedback now')
      this.setState({ incompleteTranscriptExists: false })
    }
  }

  loadSubtitle = (status) => {
    const tempChapter = [{
      keyword: '',
      segments: [
        {
          endTime: 0,
          startTime: 0,
          words: status.data.transcription.text
        }]
    }]
    this.setState({ chapters: tempChapter })
  }

  onTimeUpdate = () => {
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

  completeTranscript = async () => {
  const { transcriptionId, chapters } = this.state
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
    }, () => {
      axios({
        method: 'post',
        url: `/api/v1/training/${transcriptionId}/0/0`,
        data: {
          text: chapters[0].segments[0].words
        },
        contentType: 'application/json',
        acceptEncoding: 'gzip, deflate'
      })

      this.loadCurrentTranscript()
    })
  }

  skipTranscript = () => {
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
    }, () => {
      this.loadCurrentTranscript()
    })
  }

  rejectTranscript = async () => {
    const { transcriptionId, chapters } = this.state
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
    }, () => {
      axios({
        method: 'post',
        url: `/api/v1/training/${transcriptionId}/0/0`,
        data: {
          text: chapters[0].segments[0].words,
          status: 'REJECT'
        },
        contentType: 'application/json',
        acceptEncoding: 'gzip, deflate'
      })

      this.loadCurrentTranscript()
    })
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
      transcriptionId,
      toasts,
      incompleteTranscriptExists
    } = this.state

    return (
      <Page preferences>
        <EuiTitle size="l" style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}>
          <h1>Training</h1>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'none' : 'flex' }}
          alignItems="center"
        >
          <EuiFlexItem>
            <EuiTextAlign textAlign="center">
              <EuiImage
                size="original"
                hasShadow={false}
                caption="There is nothing to train now!"
                alt="Random nature image"
                url="https://media.giphy.com/media/26xBy4g1eHS1vqZRS/giphy.gif"
              />
            </EuiTextAlign>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
          alignItems="center"
        >
          <EuiFlexItem>
            <Player
              trackId={transcriptionId}
              getCurrentTime={this.getCurrentTime}
              updateSeek={this.onTimeUpdate}
              queryTerm={queryTerm}
              isPlaying={false}
              isContentAudio={isMediaAudio}
              ref={this.playerRef}
              searchBoxVisible={false}
              isTraining
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
        >
          <EuiFlexItem style={{ fontSize: '22px' }}>
            <Editor
              transcript={chapters}
              originalChapters={chapters}
              chapters={chapters}
              currentTime={currentTime}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              validateTranscript={this.onValidateTranscript}
              isDiffVisible={false}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists && chapters.length !== 0 ? 'flex' : 'none' }}
        >
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
        
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="m" />
        <EuiTitle size="s" style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}>
          <h6>Instructions</h6>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists && chapters.length !== 0 ? 'flex' : 'none' }}
        >
          <EuiFlexItem>
            <TrainingInstructions />
          </EuiFlexItem>
          <EuiFlexItem>
            <TrainingButtonActions />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiSpacer size="xl" />
            <EuiSpacer size="xl" />
            <EuiSpacer size="xl" />
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
