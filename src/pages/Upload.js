/* eslint-disable no-console */
/* eslint-disable no-alert */
import React, { Component, Fragment } from 'react'
import axios from 'axios'
import PropTypes from 'prop-types'
import {
  EuiForm,
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFilePicker,
  EuiButton,
  EuiSpacer, EuiText,
  EuiGlobalToastList,
  EuiProgress
} from '@elastic/eui'
import Page from '../components/Page'
import '../styles/upload.css'


export const API_PATH = '/api/v1/transcription/'

export default class UploadPage extends Component {
  DEFAULT_STATE = {
    files: [],
    loading: false,
    message: '',
    toasts: [],
    metaData: 'medical',
    selectedJob: 'ss',
    fileReset: 0,
    patientID: ''
  }

  state = this.DEFAULT_STATE

  options = [{
    value: 'medical',
    inputDisplay: 'Medical Transcript',
    dropdownDisplay: (
      <DropDown
        title="Medical Transcript"
        content="This one is used for medical records."
      />
    )
  }, {
    value: 'option_one',
    inputDisplay: 'Financial logs',
    dropdownDisplay: (
      <DropDown
        title="Financial logs"
        content="This one is used for financial records."
      />
    )
  },
  {
    value: 'option_three',
    inputDisplay: 'Legal Documents',
    dropdownDisplay: (
      <DropDown
        title="Legal Documents"
        content="Select this one for legal interrogations."
      />
    )
  }]

  jobs = [{
    value: 'ks_ögon',
    inputDisplay: 'KS - Ögon',
    dropdownDisplay: (
      <DropDown
        title="Karolinska Sjukhuset :: Ögon"
        content="Upload the medical transcript as KS-Ögon"
      />
    )
  }, {
    value: 'ks_hjärta',
    inputDisplay: 'KS - Hjärta',
    dropdownDisplay: (
      <DropDown
        title="Karolinska Sjukhuset :: Hjärta"
        content="Upload the medical transcript as KS-Hjärta"
      />
    )
  }, {
    value: 'su_hjärna',
    inputDisplay: 'SU - hjärna',
    dropdownDisplay: (
      <DropDown
        title="Sahlgrenska Universitetssjukhuset :: Hjärna"
        content="Upload the medical transcript as SU- Hjärna"
      />
    )
  }]

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Upload'
  }

  onMetadataChange = (metaData) => {
    this.setState({ metaData })
  }

  onJobChange = (selectedJob) => {
    this.setState({ selectedJob })
  }

  onFilesChange = (files) => {
    let audioFile
    let metadataFile

    if (files[0].name.split('.').pop() === 'wav' && files[1].name.split('.').pop() === 'json') {
      [audioFile, metadataFile] = [files[0], files[1]]
    } else if (files[0].name.split('.').pop() === 'json' && files[1].name.split('.').pop() === 'wav') {
      [audioFile, metadataFile] = [files[1], files[0]]
    } else {
      alert('There has to be one audio file and another metadata file')
    }

    if (files.length === 2 && (audioFile && metadataFile)) {
      const fileReader = new FileReader()
      fileReader.readAsText(metadataFile)
      fileReader.onload = (e) => {
        const { patientID } = JSON.parse(e.target.result)
        const { shortName } = JSON.parse(e.target.result).department
        this.setState({ patientID, selectedJob: shortName })
      }
      this.setState({ files })
    } else {
      alert('Select one audio file with corresponding metadata file.')
    }
  }

  onSubmit = () => {
    const loading = true
    this.setState({ loading })
    this.uploadFiles()
  }

  uploadFiles = async () => {
    const { files, metaData, selectedJob } = this.state
    const requests = Array.from(files).map(file => this.uploadFile(file, metaData, selectedJob))
    await Promise.all(requests).catch(this.onUploadFailed)
    return this.onUploaded()
  }

  uploadFile = (file, metadata, selectedJob) => {
    const body = new FormData()
    body.append('audio', file)
    if (metadata) {
      body.set('metadata', new Blob([JSON.stringify({ transcription: { model: metadata, tags: [selectedJob] } })], {
        type: 'audio/wav'
      }))
    }
    return axios.post(API_PATH, body)
  }

  onUploaded = () => {
    this.setState({
      ...this.DEFAULT_STATE,
      toasts: [{
        id: '0',
        title: '',
        color: 'primary',
        text: (
          <Fragment>
            <h3>Successfully uploaded files</h3>
            <EuiProgress size="s" color="subdued" />
          </Fragment>)
      }]
    }, () => {
      const fileInput = document.querySelector('.euiFilePicker__input')
      fileInput.files = null
    })
  }

  onUploadFailed = (e) => {
    this.setState({ ...this.DEFAULT_STATE })
    throw e
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }

  render() {
    const {
      loading,
      toasts,
      selectedJob,
      files,
      patientID
    } = this.state
    return (
      <Page preferences title="Upload">
        <EuiSpacer size="l" />
        <EuiForm>
          <EuiFormRow label="Personnummer" style={files.length !== 0 ? { display: 'inline' } : { display: 'none' }}>
            <EuiText>
              <h2>{patientID}</h2>
            </EuiText>
          </EuiFormRow>
          <EuiFormRow label="Attach files">
            <EuiFilePicker
              multiple
              initialPromptText="Click here to upload a media file"
              onChange={this.onFilesChange}
            // className="lol"
            />
          </EuiFormRow>
          {/* <EuiFormRow label="Choose model for the transcript">
            <EuiSuperSelect
              options={this.options}
              valueOfSelected={metaData}
              onChange={this.onMetadataChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow> */}
          <EuiFormRow label="Job of this transcript" style={files.length !== 0 ? { display: 'inline' } : { display: 'none' }}>
            <EuiText>
              <h2>{selectedJob}</h2>
            </EuiText>
          </EuiFormRow>
          {/* <EuiFormRow label="Choose a job for the transcript">
            <EuiSuperSelect
              options={this.jobs}
              valueOfSelected={selectedJob}
              onChange={this.onJobChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow> */}
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={this.onSubmit} isLoading={loading} style={files.length !== 0 ? { display: 'inline' } : { display: 'none' }}>
                Upload
              </EuiButton>
            </EuiFlexItem>
            {/* <EuiFlexItem>
              {message}
            </EuiFlexItem> */}
          </EuiFlexGroup>
        </EuiForm>
        <EuiGlobalToastList
          // style={{ display: incompleteTranscriptExists && chapters.length ? 'flex' : 'none' }}
          toasts={toasts}
          dismissToast={this.removeToast}
          toastLifeTimeMs={1000}
        />
      </Page>
    )
  }
}

const DropDown = ({ title, content }) => (
  <Fragment>
    <strong>{title}</strong>
    <EuiSpacer size="xs" />
    <EuiText size="s" color="subdued">
      <p className="euiTextColor--subdued">
        {content}
      </p>
    </EuiText>
  </Fragment>
)

DropDown.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired
}
