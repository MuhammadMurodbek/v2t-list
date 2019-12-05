import React, { Component, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiTitle,
  EuiGlobalToastList,
  EuiProgress,
  EuiTextAlign,
  EuiText,
  EuiButtonEmpty
} from '@elastic/eui'
import swal from 'sweetalert'
import api from '../api'
import Player from '../components/Player'
import Page from '../components/Page'
import '../styles/simple-player.css'
import TrainingHelp from '../components/training/TrainingHelp'
import Preview from '../components/training/Preview'

export default class UploadPage extends Component {
  state = {
    isMediaAudio: true,
    queryTerm: false,
    chapters: [],
    transcriptionId: 0,
    mediaId: 0,
    toasts: [],
    incompleteTranscriptExists: true,
    previewContents: '',
    isPreviewVisible: false,
    revision: 0,
    sequenceNumber: 0,
    finalChapters: ''
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Träning ⛷'
    this.playerRef = React.createRef()
    this.setState({
      toasts: [{
        id: 0,
        title: '',
        color: 'primary',
        text: (
          <Fragment>
            <h3>Träningdata kommer</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    }, () => {
      this.loadCurrentTranscript()
    })
  }

  loadCurrentTranscript = async () => {
    const status = await api.trainingGetNext()
    if (status.data.transcription) {
      this.setState({
        transcriptionId: status.data.transcription.transcriptionId,
        mediaId: status.data.transcription.media
      }, () => {
        this.loadSubtitle(status)
      })
    } else {
      this.setState({ incompleteTranscriptExists: false })
    }
  }

  loadSubtitle = (status) => {
    this.setState({
      chapters: status.data.transcription.text,
      previewContents: status.data.transcription.text,
      revision: status.data.transcription.revision,
      sequenceNumber: status.data.transcription.sequenceNumber
    })
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

  textReplacementForTraining = (textSegment) => {
    let updatedTextSegment = textSegment
    updatedTextSegment = updatedTextSegment.replace(/\./g, ' punkt ')
    updatedTextSegment = updatedTextSegment.replace(/,/g, ' komma ')
    updatedTextSegment = updatedTextSegment.replace(/:/g, ' kolon ')
    updatedTextSegment = updatedTextSegment.replace(/%/g, ' procent ')
    updatedTextSegment = updatedTextSegment.replace(/  +/g, ' ')
    updatedTextSegment = updatedTextSegment.replace(/\?/g, ' frågetecken ')
    updatedTextSegment = updatedTextSegment.replace(/!/g, ' utropstecken ')
    updatedTextSegment = updatedTextSegment.replace(/\(/g, ' parentes ')
    updatedTextSegment = updatedTextSegment.replace(/\)/g, ' slut parentes ')
    return updatedTextSegment
  }

  onUpdateTranscript = (e) => {
    const { finalChapters } = this.state
    this.setState({ finalChapters: e.target.textContent }, () => {
      if (finalChapters) {
        this.showPreview()
      }
    })
  }

  textProcessBeforeCompletion = () => {
    const { finalChapters } = this.state
    const allTheWords = finalChapters.split(' ')
    let updatedChapters = ''
    if (finalChapters) {
        allTheWords.forEach((word, i) => {
          if (i < allTheWords.length-1) {
            updatedChapters += this.textReplacementForTraining(word) + ' '
          } else {
            updatedChapters += this.textReplacementForTraining(word)
          }
        })
    }
    return updatedChapters
  }

  showPreview = () => {
    const updatedChapters = this.textProcessBeforeCompletion()
    this.setState({ previewContents: updatedChapters })
  }

  completeTranscript = () => {
    const {
      transcriptionId,
      previewContents,
      sequenceNumber
    } = this.state
    this.textProcessBeforeCompletion()
    let reg = /^[A-Za-z åäöé]+$/
    if (previewContents.match(reg)) {
      this.setState({
        toasts: [{
          id: 0,
          title: '',
          color: 'success',
          text: (
            <Fragment>
              <h3>Träningdata sparar</h3>
              <EuiProgress size="s" color="subdued" />
            </Fragment>)
        }]
      }, async () => {
        this.setState({ chapters: [] })
        await api.trainingUpdate(transcriptionId, sequenceNumber, previewContents)
        this.loadCurrentTranscript()
      })
    } else {      
      swal({
        title: '',
        text: 'Använd bara bokstäver (instruktionen har en lista på giltiga tecken)!',
        icon: 'warning',
        button: 'Avbryt'
      })
    }
  }

  skipTranscript = () => {
    this.setState({
      toasts: [{
        id: 0,
        title: '',
        color: 'primary',
        text: (
          <Fragment>
            <h3>Träningdata kommer</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    }, () => {
      this.setState({ chapters: [] })
      this.loadCurrentTranscript()
    })
  }

  rejectTranscript = () => {
    const {
      transcriptionId,
      sequenceNumber
    } = this.state

    this.setState({
      toasts: [{
        id: 0,
        title: '',
        color: 'danger',
        text: (
          <Fragment>
            <h3>Träningdata hoppas över</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    }, async () => {
      this.setState({ chapters: [] })
      await api.trainingReject(transcriptionId, sequenceNumber)
      this.loadCurrentTranscript()
    })
  }

  onValidateTranscript = (errors) => {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ errors })
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }

  changePreviewVisibility = () => {
    const { isPreviewVisible } = this.state
    this.setState({
      isPreviewVisible: !isPreviewVisible
    })
  }


  render() {
    const {
      isMediaAudio,
      queryTerm,
      chapters,
      mediaId,
      toasts,
      incompleteTranscriptExists,
      previewContents,
      isPreviewVisible,
      autoplayStatus
    } = this.state

    const visibilityChange = isPreviewVisible ? 'Dolj' : 'Visa'

    return (
      <Page preferences title="">
        <EuiTitle size="l" style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}>
          <h1>Träning</h1>
        </EuiTitle>
        <EuiSpacer size="l" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'none' : 'flex' }}
          alignItems="center"
        >
          <EuiFlexItem>
            <EuiTextAlign textAlign="center">
              <EuiText>
                <h1 style={{ fontSize: '100px', marginTop: '30vh' }}>
                  <span role="img" aria-label="Shortcake">
                    🍰
                  </span>
                </h1>
                <h1 style={{ fontSize: '50px', marginTop: '5vh' }}>
                  All done
                </h1>
              </EuiText>
            </EuiTextAlign>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
          alignItems="center"
        >
          <EuiFlexItem>
            <Player
              trackId={mediaId}
              getCurrentTime={this.getCurrentTime}
              updateSeek={this.onTimeUpdate}
              queryTerm={queryTerm}
              isContentAudio={isMediaAudio}
              ref={this.playerRef}
              searchBoxVisible={false}
              isTraining
              autoplayEnabled={autoplayStatus}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiSpacer size="m" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
        >
          <EuiFlexItem style={{ fontSize: '22px' }}>
            <EuiText>
              <pre>
                <code
                  onKeyUp={ this.onUpdateTranscript }
                  contentEditable
                  suppressContentEditableWarning
                >{chapters}</code>
              </pre>
            </EuiText>
            <EuiSpacer size="m" />
            <EuiText textAlign="right">
              <EuiButtonEmpty onClick={this.changePreviewVisibility} style={{ display: incompleteTranscriptExists && chapters.length ? 'flex' : 'none' }}>
                {visibilityChange}
                &nbsp;
                Förhandsvisning
              </EuiButtonEmpty>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiFlexGroup>
          <EuiFlexItem style={{ fontSize: '22px' }}>
            <Preview visible={isPreviewVisible} contents={previewContents} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
        >
          <EuiFlexItem grow={false}>
            <EuiButton className="complete" fill color="secondary" onClick={this.completeTranscript}>Godkänn</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton className="skip" color="warning" onClick={this.skipTranscript}>Hoppa över</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton className="reject" fill color="danger" onClick={this.rejectTranscript}>Reject</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xxl" />
        <EuiSpacer size="m" />
        <EuiTitle size="s" style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}>
          <h6>Instruktioner</h6>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiFlexGroup
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
        >
          <EuiFlexItem>
            <TrainingHelp />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiGlobalToastList
          style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
          toasts={toasts}
          dismissToast={this.removeToast}
          toastLifeTimeMs={1000}
        />
      </Page>
    )
  }
}
