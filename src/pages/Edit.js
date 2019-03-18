import React, { Component, Fragment } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiSelect,
  EuiText, EuiSpacer, EuiButton,
  EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader,
  EuiTitle, EuiCodeBlock, EuiIcon, EuiCheckboxGroup,
  EuiRadioGroup
} from '@elastic/eui'
import axios from 'axios'
import Page from '../components/Page'
import Editor from '../components/Editor'
import Tags from '../components/Tags'

export default class EditPage extends Component {
  static defaultProps = {
    transcript: null
  }

  options = [
    { value: '3', text: '3' },
    { value: '4', text: '4' },
    { value: '5', text: '5' }
  ]

  radios = [{
    id: `1`,
    label: '1'
  }, {
    id: `3`,
    label: '3'
  }, {
    id: `5`,
    label: '5'
  }];

  state = {
    subtitles: null,
    track: null,
    keywords: null,
    numberOfWords: this.options[0].value,
    isFlyoutVisible: false,
    radioIdSelected: '3'
  }

  componentDidMount() {
    this.ref = React.createRef()
    this.loadSubtitles()
  }

  componentDidUpdate(prevProps) {
    if (this.props.transcript !== prevProps.transcript) {
      this.loadSubtitles()
    }
  }

  closeFlyout = () => {
    this.setState({ isFlyoutVisible: false })
  }

  showFlyout = () => {
    this.setState({ isFlyoutVisible: true })
  }

  loadSubtitles = () => {
    const { transcript } = this.props
    const { numberOfWords } = this.state
    let id

    if (transcript) {
      id = transcript.id
      if (id) { this.setState({ track: id })}
    }

    if (!id) return null
    const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null
    const queryString = `/api/v1/transcription/${id}?segmentLength=${numberOfWords}`
    axios.get(queryString)
      .then((response) => {
        const subtitles = response.data.transcriptions[0]
          .segments.map((subtitle, i) => (
            <Subtitle
              key={i}
              words={subtitle.words}
              startTime={subtitle.startTime}
              endTime={subtitle.endTime}
              currentTime={currentTime}
            />
          ))
        this.setState({ subtitles })
        this.setState({ keywords: response.data.transcriptions[0].keywords})
      })
      .catch((error) => {
        // handle error
        this.setState({ subtitles: null })
      })
  }

  updateSubtitles = () => {
    const { subtitles } = this.state
    const currentTime = this.ref && this.ref.current ? this.ref.current.currentTime : null

    if (subtitles) {
      const tempSubtitles = subtitles.map((subtitle, i) => (
        <Subtitle
          key={i}
          words={subtitle.props.words}
          startTime={subtitle.props.startTime}
          endTime={subtitle.props.endTime}
          currentTime={currentTime}
        />
      ))
      this.setState({ subtitles: tempSubtitles })
    }
  }

  // changeNumberOfWords = (e) => {
  //   this.setState({ numberOfWords: e.target.value }, () => {
  //     this.loadSubtitles()
  //   })
  // }
  changeNumberOfWords = (optionId) => {
    this.setState({
      radioIdSelected: optionId
    }, () => {
      this.setState({ numberOfWords: optionId }, () => {
        this.loadSubtitles()
      })
    })
  }

  // finalize = () => {
  //   const { transcript } = this.props
  //   const { id } = transcript
  //   const queryString = `/api/v1/transcription/${id}`
  //   console.log(queryString)

  //   // axios.put(queryString,
  //   //   {
  //   //     tags: null,
  //   //     transcriptions: [
  //   //       {
  //   //         keyword: "test",
  //   //         segments: [
  //   //           {
  //   //             words: "ett två tre fyra",
  //   //             startTime: null,
  //   //             endTime: null
  //   //           }
  //   //         ]
  //   //       }
  //   //     ]
  //   //   })
  //   //   .then((response) => {
  //   //     console.log(response)
  //   //   })
  //   //   .catch((error) => {
  //   //     console.log(error)
  //   //   })

  // }

  // save = () => {
  //   console.log('save')
  // }

  // cancel = () => {
  //   console.log('cancel')
  // }

  render() {
    const { transcript } = this.props
    let id
    if(transcript){ id  = transcript.id}
    const { subtitles, track, keywords } = this.state
    if (!transcript) return null

    let flyout
    if (this.state.isFlyoutVisible) {
      flyout = (
        <EuiFlyout
          onClose={this.closeFlyout}
          aria-labelledby="flyoutTitle"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2 id="flyoutTitle">
                Select Preferred Columns
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <Fragment>
              <EuiRadioGroup
                options={this.radios}
                idSelected={this.state.radioIdSelected}
                onChange={this.changeNumberOfWords}
              />
            </Fragment>
            {/* {<EuiCheckboxGroup
              options={this.state.columnObjects}
              idToSelectedMap={this.state.checkboxIdToSelectedMap}
              onChange={this.selectPreferredColumns}
            />} */}
          </EuiFlyoutBody>
        </EuiFlyout>
      )
    }

    return (
      <Page title="Editor">
        {
          <div>
            <EuiFlexGroup direction="column" alignItems="flexEnd">
              <EuiFlexItem grow={true} style={{width: '150px'}}>
                    <Fragment>
                      <EuiIcon
                        type="gear"
                        size="xl"
                        className="gear"
                        onClick={this.showFlyout}
                      />
                      {flyout}
                    </Fragment>
              </EuiFlexItem>
                  {/* <EuiText><h4>Number of words</h4></EuiText>
                  <EuiSelect
                    options={this.options}
                    value={this.state.numberOfWords}
                    onChange={this.changeNumberOfWords}
                    aria-label="Use aria labels when no actual label is in use"
                  />
                  <EuiSpacer size="m" /> */}



            </EuiFlexGroup >

            <br />
            <br />
            <br />
            <EuiFlexGroup wrap>
              <EuiFlexItem grow={true}>
                <figure>
                  <audio
                    controls
                    src={`/api/v1/transcription/${track}/audio`}
                    ref={this.ref}
                    onTimeUpdate={this.updateSubtitles}
                    style={{ width: '100%' }}
                  >
                    Your browser does not support the
                    <code>audio</code>
                    element.
                  </audio>
                </figure>
              </EuiFlexItem>

            </EuiFlexGroup>
            <EuiFlexGroup wrap >
              <EuiFlexItem >
                <Editor transcript={subtitles} id={id}/>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <Tags values={keywords} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        }
      </Page>
    )
  }
}

const Subtitle = ({words, startTime, endTime, currentTime}) => {
  const notCurrent = currentTime <= startTime || currentTime > endTime
  if (notCurrent) return <span>{words}&nbsp;</span>
  return (
    <span style={{ fontWeight: 'bold', backgroundColor: '#FFFF00' }}>
      {words}&nbsp;
    </span>
  )
}
