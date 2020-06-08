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
import Page from '../components/Page'
import { EuiI18n } from '@elastic/eui'
import {
  addUnexpectedErrorToast,
  addWarningToast
} from '../components/GlobalToastList'

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
    selectedSchema: undefined,
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
    ],
    selectedJournalSystem: 'WEBDOC'
  }

  state = {
    ...this.DEFAULT_STATE,
    schemaOptions: []
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

  journalSystems = [
    {
      value: 'WEBDOC',
      inputDisplay: 'Webdoc',
      dropdownDisplay: <DropDown title="Webdoc" />
    },
    {
      value: 'J4',
      inputDisplay: 'J4',
      dropdownDisplay: <DropDown title="J4" />
    }
  ]

  componentDidMount = async () => {
    document.title = 'Inovia AI :: Ladda Upp'
    localStorage.setItem('transcriptId', '')
    // load the list of schemaOptions
    try {
      const { data } = await api.getSchemas()
      const schemaOptions = data.schemas.map((schema) => {
        return {
          value: schema.id,
          inputDisplay: schema.name,
          dropdownDisplay: <DropDown title={schema.name} />
        }
      })
      const defaultSchema = schemaOptions && schemaOptions.find(({inputDisplay}) => inputDisplay === 'Allergi')
      const selectedSchema = defaultSchema && defaultSchema.value
      this.setState({ schemaOptions, selectedSchema })
    } catch {
      addUnexpectedErrorToast()
    }
  }

  onMetadataChange = (metaData) => {
    this.setState({ metaData }, () => {
      // console.log(this.state.metaData)
    })
  }

  onJournalSystemChange = (selectedJournalSystem) => {
    this.setState({ selectedJournalSystem })
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
      addWarningToast(
        <EuiI18n token="unableToUpload" default="Unable to upload" />,
        <EuiI18n token="fileIsMissing" default="File is missing" />
      )
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
      selectedSchema,
      selectedJournalSystem
    } = this.state

    const { data: schema } = await api.getSchema(selectedSchema)
    const requests = Array.from(files).map((file) =>
      api
        .uploadMedia(
          file,
          metaData,
          selectedJob,
          patientsnamn,
          patientnummer,
          doktorsnamn,
          avdelning,
          schema.mappings.MEDSPEECH,
          selectedJournalSystem
        )
        .catch(() => {
          addUnexpectedErrorToast()
        })
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

  onSchemaChange = (selectedSchema) => {
    this.setState({ selectedSchema })
  }

  render() {
    const {
      loading,
      metaData,
      toasts,
      selectedJob,
      jobs,
      schemaOptions,
      selectedSchema,
      selectedJournalSystem
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
                token="chooseTheJournalSystemForTheTranscription"
                default="Target EMR"
              />
            }
          >
            <EuiSuperSelect
              options={this.journalSystems}
              valueOfSelected={selectedJournalSystem}
              onChange={this.onJournalSystemChange}
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
                token="selectSchemaForTheTranscription"
                default="Select a schema for the transcription"
              />
            }
          >
            <EuiSuperSelect
              options={schemaOptions}
              valueOfSelected={selectedSchema}
              onChange={this.onSchemaChange}
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
