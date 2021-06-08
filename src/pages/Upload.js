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
  EuiComboBox,
  EuiFieldText,
  EuiI18n,
  EuiLoadingContent,
  EuiHorizontalRule,
  EuiCallOut
} from '@patronum/eui'
import jwtDecode from 'jwt-decode'
import api from '../api'
import Page from '../components/Page'
import {
  addUnexpectedErrorToast,
  addWarningToast
} from '../components/GlobalToastList'
import { PreferenceContext } from '../components/PreferencesProvider'

export default class UploadPage extends Component {

  static contextType = PreferenceContext

  DEFAULT_STATE = {
    files: [],
    toasts: [],
    departmentId: null,
    schemaId: null,
    schemaFields: [],
    transcriptionFields: {},
    isLoadingSchema: false,
    uploading: false
  }

  state = {
    ...this.DEFAULT_STATE,
    departments: [],
    schemas: []
  }

  constructor(props) {
    super(props)
    this.fileInputRef = React.createRef()
  }

  componentDidMount = async () => {
    const { setTranscriptId } = this.context

    setTranscriptId('')
    await this.loadDepartments()
  }

  loadDepartments = async () => {
    try {
      const { data } = await api.getDepartments()
      const departments = this.parseList(data.departments)
      this.setState({ departments })
      if (departments.length)
        this.onDepartmentChange([departments[0]])
    } catch (e) {
      addUnexpectedErrorToast(e)
    }
  }

  loadSchemas = async () => {
    const { departmentId } = this.state
    try {
      const { data } = await api.getSchemas({ departmentId })
      const schemas = this.parseList(data.schemas)
      this.setState({ schemas })
      if (schemas.length)
        this.onSchemaChange([schemas[0]])
    } catch (e) {
      addUnexpectedErrorToast(e)
    }
  }

  parseList = (list) =>
    list.map(({ id, name }) => ({ value: id, label: name }))

  setDefaultValues = () => {
    const { schemaFields } = this.state
    const nameField = schemaFields.find(field =>
      field.mappings && field.mappings.COWORKER === 'doctor_full_name')
    const name = this.getName()
    const transcriptionFields = nameField ? { [nameField.id]: name } : {}
    this.setState({ transcriptionFields })
  }

  getName = () => {
    try {
      const token = jwtDecode(localStorage.getItem('token'))
      return token.sub.split('@')[0]
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(e)
      addWarningToast(
        <EuiI18n token="warning" default="Warning" />,
        <EuiI18n 
          token="unableToGetDoctorsName"
          default="Unable to get the name"
        />
      )
    }
  }

  onFilesChange = (files) => {
    this.setState({ files })
  }

  onSubmit = () => {
    const { files, schemaId } = this.state

    if (files.length === 0) {
      addWarningToast(
        <EuiI18n token="unableToUpload" default="Unable to upload" />,
        <EuiI18n token="fileIsMissing" default="File is missing" />
      )
    } else if(!schemaId) {
      addWarningToast(
        <EuiI18n token="unableToUpload" default="Unable to upload" />,
        <EuiI18n
          token="selectSchemaForTheTranscription"
          default="Select a schema for the transcription"
        />
      )
    } else {
      const uploading = true
      this.setState({ uploading })
      this.uploadFiles()
    }
  }

  uploadFiles = async () => {
    const { files, schemaId, transcriptionFields } = this.state
    const requests = Array.from(files).map((file) =>
      api.uploadMedia(file, schemaId, transcriptionFields)
        .catch(addUnexpectedErrorToast)
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
      this.resetForm()
    })
  }

  onUploadFailed = (e) => {
    this.setState({ ...this.DEFAULT_STATE })
    throw e
  }

  removeToast = () => {
    this.setState({ toasts: []})
  }

  resetForm = () => {
    const { schemas } = this.state
    const defaultSchema = schemas.length && schemas[0]
    if (defaultSchema)
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

  onDepartmentChange = async (selectedOptions) => {
    if (!selectedOptions.length) return
    const departmentId = selectedOptions[0].value
    this.setState({ departmentId }, this.loadSchemas)
  }

  onSchemaChange = async (selectedOptions) => {
    if (!selectedOptions.length) return
    const schemaId = selectedOptions[0].value
    this.loadSchema(schemaId)
  }

  loadSchema = async (schemaId) => {
    this.setState({ schemaId, schemaFields: [], isLoadingSchema: true })
    const { data: schema } = await api.getSchema(schemaId)
    const schemaFields = schema.fields ?
      schema.fields.filter((field => !field.editable)) : []
    this.setState({
      schemaFields,
      isLoadingSchema: false
    }, this.setDefaultValues)
  }

  onFieldChange = (id, value) => {
    this.setState(prevState => ({
      transcriptionFields: {
        ...prevState.transcriptionFields,
        [id]: value
      }
    }))
  }

  render() {
    const {
      uploading,
      toasts,
      departments,
      departmentId,
      schemas,
      schemaId,
      schemaFields,
      isLoadingSchema,
      transcriptionFields
    } = this.state

    return (
      <EuiI18n token="upload" default="Upload">{ title => {
        // set translated document title
        document.title = `Inovia AI :: ${title}`
        const selectedDepartment = departments
          .find(({ value }) => value === departmentId)
        const selectedDepartments 
          = selectedDepartment ? [selectedDepartment] : []
        const selectedSchema = schemas
          .find(({ value }) => value === schemaId)
        const selectedSchemas = selectedSchema ? [selectedSchema] : []

        return (
          <Page preferences title={title}>
            <EuiFlexGroup responsive={false}>
              <EuiFlexItem>
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
                  <EuiFormRow
                    label={<EuiI18n token="department" default="Department" />}
                  >
                    <EuiComboBox
                      options={departments}
                      onChange={this.onDepartmentChange}
                      selectedOptions={selectedDepartments}
                      singleSelection={{ asPlainText: true }}
                      isClearable={false}
                    />
                  </EuiFormRow>
                  <EuiFormRow
                    label={<EuiI18n token="schema" default="Schema" />}
                  >
                    <EuiComboBox
                      options={schemas}
                      onChange={this.onSchemaChange}
                      selectedOptions={selectedSchemas}
                      singleSelection={{ asPlainText: true }}
                      isClearable={false}
                    />
                  </EuiFormRow>
                  <EuiHorizontalRule />
                  <SchemaInputs
                    isLoadingSchema={isLoadingSchema}
                    schemaFields={schemaFields}
                    transcriptionFields={transcriptionFields}
                    onFieldChange={this.onFieldChange}
                  />
                  <EuiFlexGroup alignItems="center">
                    <EuiFlexItem grow={false}>
                      <EuiButton
                        fill
                        onClick={this.onSubmit}
                        isLoading={uploading}
                      >
                        <EuiI18n token="upload" default="Upload" />
                      </EuiButton>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiForm>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiCallOut
                  title={
                    <EuiI18n
                      token="uploadDescriptionTitle"
                      default="The schema updates the form"
                    />
                  }
                  iconType="pin"
                >
                  <span style={{ whiteSpace: 'pre-line' }}>
                    <EuiI18n
                      token="uploadDescription"
                      default={`A schema can define fields as non editable. \
                          These are fields expected \
                        to come with the audio file and are not  \
                        up to users to fill in. The form \
                        to the left contains these non editable fields.
                        If you're missing a field you have to look at  \
                        the schema configuration \
                        in the admin panel and remove the editable attribute.`
                      }
                    />
                  </span>
                </EuiCallOut>
              </EuiFlexItem>
            </EuiFlexGroup>
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

const SchemaInputs = ({ 
  isLoadingSchema, schemaFields, transcriptionFields, onFieldChange 
}) => {
  if (isLoadingSchema)
    return (
      <div style={{ maxWidth: '400px' }}>
        <EuiLoadingContent lines={6} />
      </div>
    )

  return schemaFields.map(({ id, name }) => (
    <Fragment key={id}>
      <EuiI18n token={id} default={name}>
        {(translation) => (
          <EuiFormRow label={translation}>
            <EuiFieldText
              placeholder={translation}
              value={transcriptionFields[id] || ''}
              onChange={e => onFieldChange(id, e.target.value)}
            />
          </EuiFormRow>
        )}
      </EuiI18n>
    </Fragment>
  ))
}
