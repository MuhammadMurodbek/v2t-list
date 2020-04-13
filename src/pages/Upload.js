// @ts-nocheck
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
  EuiFieldText
} from '@elastic/eui'
import api from '../api'
import swal from 'sweetalert'
import Page from '../components/Page'
import { EuiI18n } from '@elastic/eui'

export default class UploadPage extends Component {
  DEFAULT_STATE = {
    files: [],
    loading: false,
    message: '',
    toasts: [],
    metaData: 'default',
    patientsnamn: '',
    patientnummer: '',
    doktorsnamn: '',
    avdelning: '',
    selectedJob: 'KS Lungs',
    selectedTemplate: 'ext1',
    jobs: [
      {
        value: 'KS Lungs',
        inputDisplay: 'KS - Lungs',
        dropdownDisplay: <DropDown title="KS - Lungs" />
      },
      {
        value: 'KS - Heart',
        inputDisplay: 'KS - Heart',
        dropdownDisplay: <DropDown title="KS - Heart" />
      },
      {
        value: 'Akuten',
        inputDisplay: 'Akuten',
        dropdownDisplay: <DropDown title="Akuten" />
      }
    ]
  }

  state = {
    ...this.DEFAULT_STATE,
    templates: []
  }

  options = [
    {
      value: 'default',
      inputDisplay: 'Default',
      dropdownDisplay: <DropDown title="Default" />
    },
    {
      value: 'jasper',
      inputDisplay: 'Jasper 10x3',
      dropdownDisplay: <DropDown title="Jasper 10x3" />
    }
  ]

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Ladda Upp'
    localStorage.setItem('transcriptId', '')
    // load the list of templates
    const templates = await api.getSectionTemplates()
    if (templates.data) {
      const listOfTemplates = templates.data.templates
      if (listOfTemplates) {
        const templateOptions = listOfTemplates.map((template) => {
          return {
            value: template.id,
            inputDisplay: template.name,
            dropdownDisplay: <DropDown title={template.name} />
          }
        })
        this.setState({ templates: templateOptions })
      }
    }
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
    const { files } = this.state
    if (files.length === 0) {
      swal({
        title: 'Det är inte möjligt att ladda upp.',
        text: 'Fil saknas',
        icon: 'error',
        button: 'Ok'
      })
    } else {
      const loading = true
      this.setState({ loading })
      this.uploadFiles()
    }
  }

  uploadFiles = async () => {
    const {
      files,
      metaData,
      selectedJob,
      patientsnamn,
      patientnummer,
      doktorsnamn,
      avdelning,
      selectedTemplate
    } = this.state

    const requests = Array.from(files).map((file) =>
      api.uploadMedia(
        file,
        metaData,
        selectedJob,
        patientsnamn,
        patientnummer,
        doktorsnamn,
        avdelning,
        selectedTemplate
      )
    )
    await Promise.all(requests).catch(this.onUploadFailed)
    return this.onUploaded()
  }

  onUploaded = () => {
    this.setState({
      ...this.DEFAULT_STATE,
      toasts: [
        {
          id: '0',
          title: '',
          color: 'primary',
          text: (
            <Fragment>
              <h3>
                <EuiI18n
                  token="successfullyUploadedFiles"
                  default="Successfully uploaded files"
                />
              </h3>
              <EuiProgress size="s" color="subdued" />
            </Fragment>
          )
        }
      ]
    })
  }

  onUploadFailed = (e) => {
    this.setState({ ...this.DEFAULT_STATE })
    throw e
  }

  onPatientNameChange = (e) => {
    this.setState({ patientsnamn: e.target.value })
  }

  onPatientNumberChange = (e) => {
    this.setState({ patientnummer: e.target.value })
  }

  onDoctorsNameChange = (e) => {
    this.setState({ doktorsnamn: e.target.value })
  }

  onDepartmentChange = (e) => {
    this.setState({ avdelning: e.target.value })
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }

  onTemplateChange = (selectedTemplate) => {
    this.setState({ selectedTemplate })
  }

  render() {
    const {
      loading,
      metaData,
      toasts,
      selectedJob,
      jobs,
      templates,
      selectedTemplate
    } = this.state

    return (
      <Page preferences title={<EuiI18n token="upload" default="Upload" />}>
        <EuiForm>
          <EuiFormRow
            label={<EuiI18n token="uploadFile" default="Upload File" />}
          >
            <EuiFilePicker
              initialPromptText={
                <EuiI18n token="uploadFile" default="Upload File" />
              }
              onChange={this.onFilesChange}
            />
          </EuiFormRow>
          <EuiSpacer size="xs" />
          <EuiFormRow
            label={
              <EuiI18n
                token="chooseTheModelForTheTranscription"
                default="Choose the model for the transcription"
              />
            }
          >
            <EuiSuperSelect
              options={this.options}
              valueOfSelected={metaData}
              onChange={this.onMetadataChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow
            label={
              <EuiI18n
                token="selectTheJobForTheTranscription"
                default="Select the job for the transcription"
              />
            }
          >
            <EuiSuperSelect
              options={jobs}
              valueOfSelected={selectedJob}
              onChange={this.onJobChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow
            label={
              <EuiI18n
                token="selectJournalTemplateForTheTranscription"
                default="Select journal template for the transcription"
              />
            }
          >
            <EuiSuperSelect
              options={templates}
              valueOfSelected={selectedTemplate}
              onChange={this.onTemplateChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiI18n token="patientsName" default="Patient's Name">
            {(translation) => (
              <EuiFormRow label={translation}>
                <EuiFieldText
                  placeholder={translation}
                  value={this.state.patientsnamn}
                  onChange={this.onPatientNameChange}
                />
              </EuiFormRow>
            )}
          </EuiI18n>
          <EuiSpacer size="l" />
          <EuiI18n
            token="patientsPersonalNumber"
            default="Patient's Personal Number"
          >
            {(translation) => (
              <EuiFormRow label={translation}>
                <EuiFieldText
                  placeholder={translation}
                  value={this.state.patientnummer}
                  onChange={this.onPatientNumberChange}
                />
              </EuiFormRow>
            )}
          </EuiI18n>
          <EuiSpacer size="l" />
          <EuiI18n token="doctorsName" default="Doctor's Name">
            {(translation) => (
              <EuiFormRow label={translation}>
                <EuiFieldText
                  placeholder={translation}
                  value={this.state.doktorsnamn}
                  onChange={this.onDoctorsNameChange}
                />
              </EuiFormRow>
            )}
          </EuiI18n>
          <EuiSpacer size="l" />
          <EuiI18n token="section" default="Section">
            {(translation) => (
              <EuiFormRow label={translation}>
                <EuiFieldText
                  placeholder={translation}
                  value={this.state.avdelning}
                  onChange={this.onDepartmentChange}
                />
              </EuiFormRow>
            )}
          </EuiI18n>
          <EuiSpacer size="l" />
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={this.onSubmit} isLoading={loading}>
                <EuiI18n token="upload" default="Upload" />
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

const DropDown = ({ title }) => (
  <Fragment>
    <strong>{title}</strong>
  </Fragment>
)

DropDown.propTypes = {
  title: PropTypes.string.isRequired
}
