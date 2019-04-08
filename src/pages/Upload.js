import React, { Component } from 'react'
import { EuiForm, EuiFormRow, EuiFlexGroup, EuiFlexItem, EuiFilePicker,
  EuiFieldText, EuiButton } from '@elastic/eui'
import Page from '../components/Page'

export default class UploadPage extends Component {

  API_PATH = '/api/v1/v2t-realtime'

  DEFAULT_STATE = {
    name: '',
    files: [],
    loading: false,
    message: ''
  }

  state = this.DEFAULT_STATE

  onNameChange = e => {
    const name = e.target.value
    this.setState({ name })
  }

  onFilesChange = files => {
    this.setState({ files })
  }

  onSubmit = async () => {
    const loading = true
    this.setState({ loading })
    const id = await this.initUpload()
    this.uploadChunks(id)
  }

  async initUpload() {
    const response = await fetch(`${this.API_PATH}/init`)
    const json = await response.json()
    return json.id
  }

  async uploadChunks(id) {
    const { files } = this.state
    const requests = files.map((file, i) => this.uploadChunk(id, file, i))
    await Promise.all(requests)
    return this.uploadResult(id)
  }

  async uploadChunk(id, file, i) {
    const { name } = this.state
    const body = new FormData()
    body.append('name', name)
    body.append('audioChunk', file)
    return fetch(`${this.API_PATH}/${id}/chunk/${i}`)
  }

  async finalizeUpload(id) {
    const response = await fetch(`${this.API_PATH}/${id}/complete`)
    const json = response.json()
    const message = json.message
    this.setState({ ...this.DEFAULT_STATE, message })
  }

  render() {
    const { name, message, loading } = this.state
    return (
      <Page title="Upload">
        <EuiForm>
          <EuiFormRow label="Attach files">
            <EuiFilePicker multiple onChange={this.onFilesChange} />
          </EuiFormRow>
          <EuiFormRow label="Name of full recording">
            <EuiFieldText value={name} onChange={this.onNameChange} />
          </EuiFormRow>
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={this.onSubmit} isLoading={loading}>
                Upload
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
