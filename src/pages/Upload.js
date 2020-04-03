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
    jobs: [{
      value: 'KS Lungs',
      inputDisplay: 'KS - Lungs',
      dropdownDisplay: (
        <DropDown
          title="KS - Lungs"
        />
      )
    }, {
      value: 'KS - Heart',
      inputDisplay: 'KS - Heart',
      dropdownDisplay: (
        <DropDown
          title="KS - Heart"
        />
      )
    }, {
      value: 'Akuten',
      inputDisplay: 'Akuten',
      dropdownDisplay: (
        <DropDown
          title="Akuten"
        />
      )
    }]
  }

  state = {
    ...this.DEFAULT_STATE, 
    templates: []
  }

  options = [{
    value: 'default',
    inputDisplay: 'Default',
    dropdownDisplay: (
      <DropDown
        title="Default"
      />
    )
  },
  {
    value: 'jasper',
    inputDisplay: 'Jasper 10x3',
    dropdownDisplay: (
      <DropDown
        title="Jasper 10x3"
      />
    )
  }]


  componentDidMount = async () => {
    document.title = 'Inovia AI :: Ladda Upp'
    localStorage.setItem('transcriptId', '')
    // load the list of templates
    const templates = await api.getSectionTemplates()
    if(templates.data) {
      const listOfTemplates = templates.data.templates
      if (listOfTemplates){
        const templateOptions = listOfTemplates.map((template)=>{
          return {
            value: template.id,
            inputDisplay: template.name,
            dropdownDisplay: (
              <DropDown
                title={template.name}
              />
            )        
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
    const {files} = this.state
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

    const requests = Array.from(files)
      .map(file => api.uploadMedia(file, metaData, selectedJob, patientsnamn, patientnummer, doktorsnamn, avdelning, selectedTemplate))
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
      loading, metaData, toasts, selectedJob, jobs, templates, selectedTemplate
    } = this.state
    
    return (
      <Page preferences title="Ladda Upp">
        <EuiForm>
          <EuiFormRow label="Välj fil">
            <EuiFilePicker
              initialPromptText="Ladda upp fil"
              onChange={this.onFilesChange} />
          </EuiFormRow>
          <EuiSpacer size="xs" />
          <EuiFormRow label="Välj AI modell för transkriberingen">
            <EuiSuperSelect
              options={this.options}
              valueOfSelected={metaData}
              onChange={this.onMetadataChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow label="Välj job för transkriptet">
            <EuiSuperSelect
              options={jobs}
              valueOfSelected={selectedJob}
              onChange={this.onJobChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow label="Välj journalmall för transkriptet">
            <EuiSuperSelect
              options={templates}
              valueOfSelected={selectedTemplate}
              onChange={this.onTemplateChange}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow label="Patients Namn">
            <EuiFieldText
              placeholder="Patients Namn"
              value={this.state.patientsnamn}
              onChange={this.onPatientNameChange}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow label="Patients Personnummer">
            <EuiFieldText
              placeholder="Patients Personnummer"
              value={this.state.patientnummer}
              onChange={this.onPatientNumberChange}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow label="Doktors Namn">
            <EuiFieldText
              placeholder="Doktors Namn"
              value={this.state.doktorsnamn}
              onChange={this.onDoctorsNameChange}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiFormRow label="Avdelning">
            <EuiFieldText
              placeholder="Avdelning"
              value={this.state.avdelning}
              onChange={this.onDepartmentChange}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
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

const DropDown = ({ title }) => (
  <Fragment>
    <strong>{title}</strong>
  </Fragment>
)

DropDown.propTypes = {
  title: PropTypes.string.isRequired
}
