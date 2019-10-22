import React, { Component, Fragment } from 'react'
import axios from 'axios'

import PropTypes from 'prop-types'
import {
  EuiButton,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiGlobalToastList,
  EuiProgress,
  EuiSpacer,
  EuiSuperSelect,
  EuiText
} from '@elastic/eui'
import api from '../api'
import Page from '../components/Page'
export const API_PATH = '/api/v1/transcription/'



export default class UploadPage extends Component {
  DEFAULT_STATE = {
    files: [],
    loading: false,
    message: '',
    toasts: [],
    metaData: 'medical',
    selectedJob: 'ks_ögon'
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
    this.setState({ metaData }, ()=> {
      console.log(this.state.metaData)
    })
  }

  onJobChange = (selectedJob) => {
    this.setState({ selectedJob })
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
    const { files, metaData, selectedJob } = this.state
    const requests = Array.from(files)
      .map(file => api.uploadMedia(file, metaData, selectedJob))
    await Promise.all(requests)
      .catch(this.onUploadFailed)
    return this.onUploaded()
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
    })
    // const message = 'Successfully uploaded files'
    // this.setState({ ...this.DEFAULT_STATE, message })
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
      metaData,
      toasts,
      selectedJob
    } = this.state
    return (
      <Page preferences title="Upload">
        <EuiForm>
          <EuiFormRow label="Attach files">
            <EuiFilePicker onChange={this.onFilesChange} />
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
          <EuiFormRow label="Choose jobs for the transcript">
            <EuiSuperSelect
              options={this.jobs}
              valueOfSelected={selectedJob}
              onChange={this.onJobChange}
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