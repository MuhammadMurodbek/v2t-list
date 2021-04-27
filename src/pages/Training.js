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
  EuiButtonEmpty,
  EuiTextArea,
  EuiI18n
} from '@patronum/eui'
import api from '../api'
import Player from '../components/Player'
import Page from '../components/Page'
import '../styles/simple-player.css'
import TrainingHelp from '../components/training/TrainingHelp'
import Preview from '../components/training/Preview'
import {
  addErrorToast,
  addUnexpectedErrorToast
} from '../components/GlobalToastList'

export default class UploadPage extends Component {
  state = {
    isMediaAudio: true,
    queryTerm: false,
    chapters: '',
    transcriptionId: 0,
    mediaId: null,
    toasts: [],
    incompleteTranscriptExists: true,
    previewContents: '',
    isPreviewVisible: false,
    finalChapters: '',
    token: localStorage.getItem('token')
  }

  componentDidMount = async () => {
    this.playerRef = React.createRef()
    this.setState(
      {
        toasts: [
          {
            id: '0',
            title: '',
            color: 'primary',
            text: (
              <Fragment>
                <h3>
                  <EuiI18n
                    token="trainingDataWillCome"
                    default="Training data will come"
                  />
                </h3>
                <EuiProgress size="s" color="subdued" />
              </Fragment>
            )
          }
        ]
      },
      () => {
        this.loadCurrentTranscript()
      }
    )
    localStorage.setItem('transcriptId', '')
  }

  loadCurrentTranscript = async () => {
    try {
      const status = await api.trainingGetNext()
      if (status.data.data) {
        this.setState(
          {
            transcriptionId: status.data.data.id,
            mediaId: status.data.data.id
          },
          () => {
            this.loadSubtitle(status)
          }
        )
      } else {
        this.setState({ incompleteTranscriptExists: false })
      }
    } catch(e) {
      this.setState({ incompleteTranscriptExists: false })
      addUnexpectedErrorToast(e)
    }
  }

  loadSubtitle = (status) => {
    this.setState({
      chapters: status.data.data.text,
      previewContents: status.data.data.text
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
    const { value } = e.target
    this.setState({ chapters: value.replace('\n', '') })
    this.setState({ finalChapters: value }, () => {
      this.showPreview()
    })
  }

  textProcessBeforeCompletion = () => {
    const { finalChapters } = this.state
    const allTheWords = finalChapters.split(' ')
    let updatedChapters = ''
    if (finalChapters) {
      allTheWords.forEach((word, i) => {
        if (i < allTheWords.length - 1) {
          updatedChapters += `${this.textReplacementForTraining(word)} `
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
    const { transcriptionId, previewContents } = this.state
    this.textProcessBeforeCompletion()
    const reg = /^[A-Za-z åäöé']+$/
    if (previewContents.match(reg)) {
      this.setState(
        {
          toasts: [
            {
              id: '0',
              title: '',
              color: 'success',
              text: (
                <Fragment>
                  <h3>
                    <EuiI18n
                      token="exerciseDataSaves"
                      default="Exercise data saves"
                    />
                  </h3>
                  <EuiProgress size="s" color="subdued" />
                </Fragment>
              )
            }
          ]
        },
        async () => {
          this.setState({ chapters: '' })
          try {
            await api.trainingUpdate(transcriptionId, previewContents)
          } catch(e) {
            addUnexpectedErrorToast(e)
          }
          this.loadCurrentTranscript()
        }
      )
    } else {
      addErrorToast(
        <EuiI18n
          token="lettersError"
          default={
            'Use only letters (the instruction has  \
            a list of valid characters)!'
          }
        />
      )
    }
  }

  skipTranscript = () => {
    this.setState(
      {
        toasts: [
          {
            id: '0',
            title: '',
            color: 'primary',
            text: (
              <Fragment>
                <h3>
                  <EuiI18n
                    token="trainingDataWillCome"
                    default="Training data will come"
                  />
                </h3>
                <EuiProgress size="s" color="subdued" />
              </Fragment>
            )
          }
        ]
      },
      () => {
        this.setState({ chapters: '' })
        this.loadCurrentTranscript()
      }
    )
  }

  rejectTranscript = () => {
    const { transcriptionId } = this.state

    this.setState(
      {
        toasts: [
          {
            id: '0',
            title: '',
            color: 'danger',
            text: (
              <Fragment>
                <h3>
                  <EuiI18n
                    token="exerciseDataIsSkipped"
                    default="Exercise data is skipped"
                  />
                </h3>
                <EuiProgress size="s" color="subdued" />
              </Fragment>
            )
          }
        ]
      },
      async () => {
        this.setState({ chapters: []})
        try {
          await api.trainingReject(transcriptionId)
        } catch {
          addErrorToast(
            <EuiI18n token="error" default="Error" />,
            <EuiI18n
              token="trainingNotExists"
              default={
                'The action cannot be performed \
                as transcript can no longer be found'
              }
            />
          )
        }
        this.loadCurrentTranscript()
      }
    )
  }

  onValidateTranscript = (errors) => {
    // eslint-disable-next-line react/no-unused-state
    this.setState({ errors })
  }

  removeToast = () => {
    this.setState({ toasts: []})
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
      autoplayStatus,
      token
    } = this.state

    const visibilityChange = (
      <EuiI18n
        token={isPreviewVisible ? 'show' : 'hide'}
        default={isPreviewVisible ? 'Show' : 'Hide'}
      />
    )

    return (
      <EuiI18n token="training" default="Training">{ title => {
        // set translated document title
        document.title = `Inovia AI :: ${title}`
        return (
          <Page preferences title={incompleteTranscriptExists ? title : ''}>
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
                      <EuiI18n token="allDone" default="All done" />
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
                  autoplayEnabled={autoplayStatus}
                  onPause={() => {}}
                  token={token}
                  isTraining
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
                <EuiTextArea
                  style={{ width: '760px' }}
                  value={chapters}
                  onChange={this.onUpdateTranscript}
                  resize="none"
                  fullWidth={true}
                />
                <EuiSpacer size="m" />
                <EuiText textAlign="right">
                  <EuiButtonEmpty
                    onClick={this.changePreviewVisibility}
                    style={{
                      display:
                        incompleteTranscriptExists && chapters.length
                          ? 'flex'
                          : 'none'
                    }}
                  >
                    {visibilityChange}
                    &nbsp; <EuiI18n token="preview" default="Preview" />
                  </EuiButtonEmpty>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiFlexGroup>
              <EuiFlexItem style={{ fontSize: '22px' }}>
                <Preview
                  visible={isPreviewVisible}
                  contents={previewContents}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup
              style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
            >
              <EuiFlexItem grow={false}>
                <EuiButton
                  className="complete"
                  fill
                  color="secondary"
                  onClick={this.completeTranscript}
                >
                  <EuiI18n token="accept" default="Accept" />
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  className="skip"
                  color="warning"
                  onClick={this.skipTranscript}
                >
                  <EuiI18n token="skip" default="Skip" />
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  className="reject"
                  fill
                  color="danger"
                  onClick={this.rejectTranscript}
                >
                  <EuiI18n token="reject" default="Reject" />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="xxl" />
            <EuiSpacer size="xxl" />
            <EuiSpacer size="m" />
            <EuiTitle
              size="s"
              style={{ display: incompleteTranscriptExists ? 'flex' : 'none' }}
            >
              <h6>
                <EuiI18n token="instructions" default="Instructions" />
              </h6>
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
      }}
      </EuiI18n>
    )
  }
}
