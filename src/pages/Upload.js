import React, { Component, Fragment } from 'react'
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
    metaData: 'default',
    selectedJob: 'ks_ögon'
  }

  state = this.DEFAULT_STATE

  options = [{
    value: 'default',
    inputDisplay: 'Default',
    dropdownDisplay: (
      <DropDown
        title="Default"
        content="Wave2Letter(19 layers)"
      />
    )
  }, {
    value: 'jasper',
    inputDisplay: 'Jasper model',
    dropdownDisplay: (
      <DropDown
        title="Jasper model"
        content="JASPER(24 layers)"
      />
    )
  }]

  jobs = [{
    value: 'ks_ögon',
    inputDisplay: 'KS - Ögon',
    dropdownDisplay: (
      <DropDown
        title="Karolinska Sjukhuset :: Ögon"
        content="Ladda upp medicinskt transkript som KS-Ögon"
      />
    )
  }, {
    value: 'ks_hjärta',
    inputDisplay: 'KS - Hjärta',
    dropdownDisplay: (
      <DropDown
        title="Karolinska Sjukhuset :: Hjärta"
        content="Ladda upp medicinskt transkript som KS-Hjärta"
      />
    )
  }, {
    value: 'su_hjärna',
    inputDisplay: 'SU - hjärna',
    dropdownDisplay: (
      <DropDown
        title="Sahlgrenska Universitetssjukhuset :: Hjärna"
        content="Ladda upp medicinskt transkript som SU- Hjärna"
      />
    )
  }]

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Ladda Upp'
  }

  onMetadataChange = (metaData) => {
    this.setState({ metaData }, () => {
      // console.log(this.state.metaData)
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
            <EuiProgress size="s" color="subdued"/>
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
            <EuiFilePicker 
              multiple 
              initialPromptText="Ladda upp filer"
              onChange={this.onFilesChange}/>
          </EuiFormRow>
          <EuiFormRow label="Välj AI modell för transkriberingen">
            <EuiSuperSelect
              options={this.options}
              valueOfSelected={metaData}
              onChange={this.onMetadataChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiFormRow label="Välj job för transkriptet">
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
                Ladda Upp
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
    <EuiSpacer size="xs"/>
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
