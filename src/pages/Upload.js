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
  EuiSuperSelect, EuiSpacer, EuiText
} from '@elastic/eui'
import Page from '../components/Page'

export const API_PATH = '/api/v1/transcription/'

export default class UploadPage extends Component {
  DEFAULT_STATE = {
    files: [],
    loading: false,
    message: '',
    metaData: 'medical'
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

  componentDidMount = async () => {
    document.title = 'Inovia AB :: Upload'
  }
  onMetadataChange = (metaData) => {
    this.setState({ metaData })
  }

  onFilesChange = (files) => {
    this.setState({ files })
  }

  onSubmit = () => {
    const loading = true
    this.setState({ loading })
    this.uploadFiles()
  }

  uploadFiles = async () => {
    const { files, metaData } = this.state
    const requests = Array.from(files).map(file => this.uploadFile(file, metaData))
    await Promise.all(requests).catch(this.onUploadFailed)
    return this.onUploaded()
  }

  uploadFile = (file, metadata) => {
    const body = new FormData()
    body.append('audio', file)
    if (metadata) {
      body.set('metadata', new Blob([JSON.stringify({ 'model': metadata })], {
        type: "application/json"
      }));
    }
    return axios.post(API_PATH, body)
  }

  onUploaded = () => {
    const message = 'Successfully uploaded files'
    this.setState({ ...this.DEFAULT_STATE, message })
  }

  onUploadFailed = (e) => {
    const message = `An error accured during file upload. ${e.message}`
    this.setState({ ...this.DEFAULT_STATE, message })
    throw e
  }

  render() {
    const { message, loading, metaData } = this.state
    return (
      <Page preferences title="Upload">
        <EuiForm>
          <EuiFormRow label="Attach files">
            <EuiFilePicker multiple onChange={this.onFilesChange} />
          </EuiFormRow>
          <EuiFormRow label="Choose model for the transcript">
            <EuiSuperSelect
              options={this.options}
              valueOfSelected={metaData}
              onChange={this.onMetadataChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={this.onSubmit} isLoading={loading}>
                Send
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem>
              {message}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
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
