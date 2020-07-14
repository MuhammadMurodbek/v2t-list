// @ts-nocheck
import React, { Component, Fragment } from 'react'
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
  EuiComboBox,
  EuiFieldText,
  EuiI18n,
  EuiLoadingContent,
  EuiSuperSelect
} from '@patronum/eui'
import jwtDecode from 'jwt-decode'
import api from '../api'
import Page from '../components/Page'
import {
  addUnexpectedErrorToast,
  addWarningToast
} from '../components/GlobalToastList'

export default class UploadPage extends Component {
  DEFAULT_STATE = {
    files: [],
    loading: false,
    toasts: [],
    departments: [],
    selectedSchema: undefined,
    selectedOptions: [],
    selectedSchemaFields: [],
    isLoadingSchema: false,
    fields: {}
  }

  state = {
    ...this.DEFAULT_STATE,
    schemaOptions: []
  }

  constructor(props) {
    super(props)
    this.fileInputRef = React.createRef()
  }

  componentDidMount = async () => {
    localStorage.setItem('transcriptId', '')
    this.loadDoctorsName()
    this.loadDepartments()
    // load the list of schemaOptions
    try {
      const { data } = await api.getSchemas()
      const schemaOptions = data.schemas.map((schema) => {
        return {
          value: schema.id,
          label: schema.name
        }
      })
      this.setState({
        schemaOptions
      }, () => {
        this.resetSelections()
      })
    } catch(e) {
      addUnexpectedErrorToast(e)
    }
  }

  loadDepartments = async () => {
    try {
      const { data } = await api.getDepartments()
      this.setState({
        departments: data.map(({id, name}) => ({
          value: id,
          inputDisplay: name
        }))
      })
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
      addWarningToast(
        <EuiI18n token="warning" default="Warning" />,
        <EuiI18n token="unableToGetDepartments" default="Unable to get departments" />
      )
    }
  }

  loadDoctorsName = () => {
    try {
      const token = jwtDecode(localStorage.getItem('token'))
      const doctorsName = token.sub.split('@')[0]
      this.setState({ doctorsName })
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
      addWarningToast(
        <EuiI18n token="warning" default="Warning" />,
        <EuiI18n token="unableToGetDoctorsName" default="Unable to get doctor's name" />
      )
    }
  }

  onFilesChange = (files) => {
    this.setState({ files })
  }

  onSubmit = () => {
    const { files, selectedSchema } = this.state
    if (files.length === 0) {
      addWarningToast(
        <EuiI18n token="unableToUpload" default="Unable to upload" />,
        <EuiI18n token="fileIsMissing" default="File is missing" />
      )
    } else if(!selectedSchema) {
      addWarningToast(
        <EuiI18n token="unableToUpload" default="Unable to upload" />,
        <EuiI18n
          token="selectSchemaForTheTranscription"
          default="Select a schema for the transcription"
        />
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
      selectedSchema,
      fields
    } = this.state

    const requests = Array.from(files).map((file) =>
      api
        .uploadMedia(
          file,
          selectedSchema,
          fields
        )
        .catch((e) => {
          addUnexpectedErrorToast(e)
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
    }, () => {
      this.resetSelections()
    })
  }

  onUploadFailed = (e) => {
    this.setState({ ...this.DEFAULT_STATE })
    throw e
  }

  removeToast = () => {
    this.setState({ toasts: [] })
  }

  resetSelections = () => {
    const { schemaOptions } = this.state
    const defaultSchema = schemaOptions && schemaOptions[0]
    this.onSchemaChange([defaultSchema])

    // clear file input field
    try {
      this.fileInputRef.current.fileInput.value = ''
      this.fileInputRef.current.state.promptText = null
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  onSchemaChange = (selectedOptions) => {
    if (selectedOptions.length) {
      const selectedSchema = selectedOptions[0].value
      this.setState({
        selectedSchema,
        selectedOptions
      })
      this.loadSelectedSchema(selectedSchema)
    }
  }

  loadSelectedSchema = async (selectedSchema) => {
    const { departments, doctorsName } = this.state
    this.setState({
      selectedSchemaFields: [],
      isLoadingSchema: true
    })
    const { data: selectedSchemaData } = await api.getSchema(selectedSchema)
    if (selectedSchemaData.fields) {
      let isDepartmentFound = false
      this.setState({
        selectedSchemaFields: selectedSchemaData.fields.reduce((fields, currentField) => {
          if (!currentField.visible) {
            const { id } = currentField
            if (!isDepartmentFound && departments.length
               && (id === 'department_id' || id === 'department_name')) {
              isDepartmentFound = true
              currentField.isToShow = true
            }
            if (id.includes('doctor') && id.includes('name')) {
              this.onFieldChange(currentField.id, doctorsName)
            }
            fields.push(currentField)
          }
          return fields
        }, []),
        isLoadingSchema: false
      })
    } else {
      this.setState({
        selectedSchemaFields: [],
        isLoadingSchema: false
      })
    }
  }

  onFieldChange = (id, value) => {
    this.setState(prevState => ({
      fields: {
        ...prevState.fields,
        [id]: value
      }
    }))
  }

  render() {
    const {
      loading,
      toasts,
      schemaOptions,
      selectedOptions,
      selectedSchemaFields,
      isLoadingSchema,
      departments,
      fields
    } = this.state

    return (
      <EuiI18n token="upload" default="Upload">{ title => {
        // set translated document title
        document.title = `Inovia AI :: ${title}`

        return (
          <Page preferences title={title}>
            <EuiForm>
              <EuiFormRow
                label={<EuiI18n token="uploadFile" default="Upload File" />}
              >
                <EuiFilePicker
                  ref={this.fileInputRef}
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
                    token="selectSchemaForTheTranscription"
                    default="Select a schema for the transcription"
                  />
                }
              >
                <EuiComboBox
                  options={schemaOptions}
                  onChange={this.onSchemaChange}
                  selectedOptions={selectedOptions}
                  singleSelection={{ asPlainText: true }}
                  isClearable={false}
                />
              </EuiFormRow>
              <EuiSpacer size="l" />
              {
                isLoadingSchema &&
                <div style={{maxWidth: '400px'}}>
                  <EuiLoadingContent lines={6} />
                  <EuiSpacer size="l" />
                </div>
              }
              {
                selectedSchemaFields.map(field => {
                  const { id, name, isToShow } = field
                  if (departments.length && (id === 'department_id' || id === 'department_name')) {
                    // show only one department select for two department properties
                    if (isToShow) {
                      return (
                        <Fragment key={id}>
                          <EuiI18n token={'department_name'} default={'Department name'}>
                            {
                              (translation) => (
                                <EuiFormRow label={translation}>
                                  <EuiSuperSelect
                                    options={departments}
                                    valueOfSelected={
                                      fields['department_id']
                                      || departments[0].value
                                    }
                                    onChange={value => {
                                      this.onFieldChange('department_id', value)
                                      this.onFieldChange('department_name',
                                        departments.find(dep => dep.value === value).inputDisplay)
                                    }}
                                  />
                                </EuiFormRow>
                              )
                            }
                          </EuiI18n>
                          <EuiSpacer size="l" />                    
                        </Fragment>
                      )
                    }
                    return null
                  }
                  return (
                    <Fragment key={id}>
                      <EuiI18n token={id} default={name}>
                        {(translation) => (
                          <EuiFormRow label={translation}>
                            <EuiFieldText
                              placeholder={translation}
                              value={fields[id]}
                              onChange={e => this.onFieldChange(id, e.target.value)}
                            />
                          </EuiFormRow>
                        )}
                      </EuiI18n>
                      <EuiSpacer size="l" />
                    </Fragment>
                  )
                })
              }
              <EuiFlexGroup alignItems="center">
                <EuiFlexItem grow={false}>
                  <EuiButton fill onClick={this.onSubmit} isLoading={loading}>
                    <EuiI18n token="upload" default="Upload" />
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiForm>
            <EuiGlobalToastList
              toasts={toasts}
              dismissToast={this.removeToast}
              toastLifeTimeMs={1000}
            />
          </Page>
        )
      }}
      </EuiI18n>
    )
  }
}
