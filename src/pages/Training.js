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
    listOfTrainingData: [{
      id: '572ba6fc-e720-40d0-bcf5-39813708b14f',
      status: 'incomplete'
    }, {
      id: 'd3d34e61-c823-45a3-9299-75cbf5fda626',
      status: 'incomplete'
    }, {
      id: '372b1a57-4d74-412b-b7af-f01ac9d460ee',
      status: 'incomplete'
    }],
    chapters: [{
      keyword: '',
      segments: [
        {
          endTime: 0,
          startTime: 0,
          words: 'Gott och opåverkad. Inga kardiella inkompensationstecken i vila. Pollenallergiker'
        }]
    }],
    trasncriptId: null,
    toasts: [],
    currentTranscript: null
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Training ⛷'
    this.playerRef = React.createRef()
    this.loadCurrentTranscript()
  }

  loadCurrentTranscript = async () => {
    const { listOfTrainingData, currentTranscript } = this.state
    const status = await axios.get('/api/v1/training/')
    if (Object.prototype.hasOwnProperty.call(status, 'transcription')) {
      this.setState({
        trasncriptId: status.transcription.transcriptionId
      })
    } else {
      // alert('Yayyyy, all transcripts have feedback now')
    }
    console.log('status')
    console.log(status)
    for (let i = 0; i < listOfTrainingData.length; i += 1) {
      if (listOfTrainingData[i].status === 'incomplete') {
        this.setState({ currentTranscript: listOfTrainingData[i] }, ()=>{
          this.loadSubtitle()
        })
        break
      }
    }
    
    let numberOfIncompleteData = 0
    for (let i = 0; i < listOfTrainingData.length; i += 1) {
      if (listOfTrainingData[i].status === 'incomplete') {
        numberOfIncompleteData += 1
      }
    }

    if (numberOfIncompleteData === 0) {
      console.log('There is no pending trainng data to be assesed')
    }
  }

  loadSubtitle = async () => {
    const { currentTranscript } = this.state
    console.log('currentTranscript')
    console.log(currentTranscript)
    if (currentTranscript) {
      const content = await axios
        .get(`http://localhost:3000/api/v1/transcription/${currentTranscript.id}`)
      console.log('content')
      console.log(content)
      let tempChapter = [{
        keyword: '',
        segments: [
          {
            endTime: 0,
            startTime: 0,
            words: ''
          }]
      }]

      let words = ''
      content.data.transcriptions[0].segments.forEach((segment) => {
        words = `${words} ${segment.words}`
      })
      tempChapter[0].segments[0].words = words
      this.setState({ chapters: tempChapter })
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
      toasts,
      currentTranscript
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
              trackId={currentTranscript ? currentTranscript.id : 0}
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
