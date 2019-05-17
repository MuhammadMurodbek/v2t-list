import React, { Component } from 'react'
import axios from 'axios'
import { EuiForm, EuiFormRow, EuiFlexGroup, EuiFlexItem, EuiFilePicker, EuiButton } from '@elastic/eui'
import Page from '../components/Page'

export const API_PATH = '/api/v1/transcription/'

export default class UploadPage extends Component {

  DEFAULT_STATE = {
    files: [],
    loading: false,
    message: ''
  }

  state = this.DEFAULT_STATE

  onFilesChange = files => {
    this.setState({ files })
  }

  onSubmit = () => {
    const loading = true
    this.setState({ loading })
    this.uploadFiles()
  }

  async uploadFiles() {
    const { files } = this.state
    const requests = Array.from(files).map((file, i) => this.uploadFile(file))
    await Promise.all(requests).catch(this.onUploadFailed)
    return this.onUploaded()
  }

  uploadFile(file) {
    const body = new FormData()
    body.append('audio', file)
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
    const { message, loading } = this.state
    return (
      <Page preferences title="Upload">
        <EuiForm>
          <EuiFormRow label="Attach files">
            <EuiFilePicker multiple onChange={this.onFilesChange} />
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
