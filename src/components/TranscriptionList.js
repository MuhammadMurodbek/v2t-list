import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import {
  EuiSwitch,
  EuiSpacer,
  EuiBasicTable,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiCallOut
} from '@elastic/eui'
import { PreferenceContext } from './PreferencesProvider'
import api, { revokeTranscription } from '../api'

import { EuiI18n, EuiConfirmModal, EuiOverlayMask } from '@elastic/eui'
import {
  addUnexpectedErrorToast, addSuccessToast, addErrorToast
} from './GlobalToastList'
import getTokenData from "../utils/getTokenData";
import jwtDecode from "jwt-decode";


const revokeTranscript = async (id) => {
  try {
    const response = await revokeTranscription({ id })
    if (response.status === 200) {
      addSuccessToast(
        <EuiI18n
          token="transcriptionRevokedSuccessfully"
          default="Transcription revoked successfully"
        />
      )
      window.location.replace(`#/edit/${id}/`)
    }
  } catch (error) {
    const { status } = error.request
    if (status === 403) {
      addErrorToast(
        <EuiI18n
          token="forbiddenRevoke"
          default="The user does not have sufficient
                     privileges to revoke the transcription"
        />
      )
    } else if (status === 409) {
      addErrorToast(
        <EuiI18n
          token="conflictRevoke"
          default="The user does not have sufficient
                     privileges to revoke the transcription"
        />
      )
    } else if (status === 400) {
      addErrorToast(
        <EuiI18n
          token="theTranscriptNotAvailable"
          default="The transcription is not available"
        />
      )
    } else {
      addErrorToast(<EuiI18n token="Error" default={error.message} />)
    }
  }
}
export default class TranscriptionList extends Component {
  static contextType = PreferenceContext

  constructor(props) {
    super(props)
    this.state = {
      pageSize: 20,
      loading: false,
      isConfirmModalVisible: false,
      dictationToRemove: null,
      sortField: 'updatedTime',
      isAutorefreshEnabled: localStorage
        .getItem('isAutorefreshEnabled')===null ? false : (
          localStorage.getItem('isAutorefreshEnabled') === 'true'
        ),
      sortDirection: 'desc'
    }
  }

  componentDidMount = async () => {
    const { setTranscriptId } = this.context

    setTranscriptId('')
    document.title = 'Inovia AI :: All Transcripts'

    this.initPollingTranscripts()
  }


  initPollingTranscripts = () => {
    const { fetchTranscripts, job, pageIndex } = this.props
    const { pageSize, isAutorefreshEnabled } = this.state
    const INTERVAL = 15000
    const BACKOFF = 5000
    let timeToMakeNextRequest = 0
    let failedTries = 0

    const setupTimer = (time) => {
      if (timeToMakeNextRequest <= time) {
        if(isAutorefreshEnabled) {
          fetchTranscripts(job, pageIndex, pageSize).then(
            () => {
              failedTries = 0
            },
            () => {
              // backoff if request fails
              failedTries++
            }
          )
        }
        timeToMakeNextRequest = time + INTERVAL + failedTries * BACKOFF
      }

      requestAnimationFrame(setupTimer)
    }

    requestAnimationFrame(setupTimer)
  }

  onTableChange = async ({ page = {}, sort = {}}) => {
    const { index: pageIndex, size: pageSize } = page
    const { field: sortField, direction: sortDirection } = sort
    const { fetchTranscripts, setPageIndex, job: department } = this.props
    this.setState({
      loading: true
    })

    await fetchTranscripts(
      department,
      pageIndex,
      pageSize,
      sortField,
      sortDirection
    )
    setPageIndex(pageIndex)
    this.setState({
      pageSize,
      sortField,
      sortDirection
    }, () => {
      this.setState({
        loading: false
      })
    })
  }

  showConfirmModal = (dictationToRemove) => {
    this.setState((prevState) => ({
      ...prevState,
      dictationToRemove,
      isConfirmModalVisible: true
    }))
  }

  closeConfirmModal = () => {
    this.setState((prevState) => ({
      ...prevState,
      isConfirmModalVisible: false,
      dictationToRemove: null
    }))
  }

  onRemoveDictationConfirmed = () => {
    const { dictationToRemove } = this.state
    this.closeConfirmModal()

    if (dictationToRemove !== null) {
      api
        .rejectTranscription(dictationToRemove)
        .then(async () => {
          await this.onTableChange({
            page: {
              index: this.props.pageIndex,
              size: this.state.pageSize
            }
          })

          addSuccessToast(
            <EuiI18n
              token="dictationRemoveSucces"
              default="The dictation has been removed successfully!"
            />
          )
        })
        .catch((e) => {
          addUnexpectedErrorToast(e)
        })
    }
  }

  getTranscriptHref = (schemaId) => {
    const { preferences } = this.context
    const token = localStorage.getItem('token')

    if (preferences.externalMode) {
      return {
        href: `/#edit/${schemaId}?token=${token}`,
        target: '_blank'
      }
    } else {
      return {
        href: `/#edit/${schemaId}`,
        target: '_self'
      }
    }
  }

  toggleAutorefresh = () => {
    const autorefreshStatus = localStorage.getItem('isAutorefreshEnabled')
    if(autorefreshStatus==='true') {
      localStorage.setItem('isAutorefreshEnabled', false)
      this.setState({ isAutorefreshEnabled: false })
    } else {
      localStorage.setItem('isAutorefreshEnabled', true)
      this.setState({ isAutorefreshEnabled: true })
    }
  }

  render() {
    const {
      pageSize,
      loading,
      isConfirmModalVisible,
      sortField,
      isAutorefreshEnabled,
      sortDirection
    } = this.state
    const {
      transcripts,
      contentLength,
      pageIndex,
      hasNoTags,
      activeDepartments
    } = this.props
    let departmentName = ''
    if (transcripts.length) {
      departmentName = activeDepartments
        .filter(department => department.id === transcripts[0].department)[0]
        .name
    }
    const { preferences } = this.context
    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: contentLength,
      pageSizeOptions: [20, 50, 100]
    }
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection
      },
      allowNeutralSort: true,
      enableAllColumns: true
    }

    let {token} = getTokenData()
    const isPermission = jwtDecode(token)?.adm

    const columns = [
      ...preferences.columnsForTranscriptList,
      {
        label: <EuiI18n token="open" default="Open" />,
        field: 'id',
        name: '',
        width: '100px',
        render: (id, transcriptInfo) => {
          if(!transcriptInfo.status) {return (<></>)}
          return transcriptInfo.status === 'TRANSCRIBED'
            || transcriptInfo.status === 'ERROR'
            || transcriptInfo.status === 'REVOKED' ? (
              <EuiButtonEmpty {...this.getTranscriptHref(id)}>
                <EuiI18n token="open" default="Open" />
              </EuiButtonEmpty>
          ) : (transcriptInfo.status === 'EXPORTED'
              || transcriptInfo.status === 'APPROVED')&&
              isPermission
            ? (
            <EuiButtonEmpty
              onClick={()=> revokeTranscript(id)}
            >
              <EuiI18n token="revoke" default="Revoke" />
            </EuiButtonEmpty>):(<></>)
        },
        disabled: true
      },
      {
        label: 'Ta bort',
        field: 'id',
        name: '',
        disabled: true,
        width: '50px',
        render: (id, transcriptInfo) => {
          if(!transcriptInfo.status) {return (<></>)}
          return transcriptInfo.status === 'TRANSCRIBED'
            ||  transcriptInfo.status === 'ERROR'? (
              <EuiButtonIcon
                color="danger"
                iconType="trash"
                aria-label="Delete"
                onClick={() => this.showConfirmModal(id)}
              />) : (<></>)
        }
      }
    ]

    const confirmModal = isConfirmModalVisible ? (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={<EuiI18n token="removeDictation" default="Remove dictation" />}
          onCancel={this.closeConfirmModal}
          onConfirm={this.onRemoveDictationConfirmed}
          cancelButtonText={
            <EuiI18n token="noDontDoIt" default="No, don't do it" />
          }
          confirmButtonText={<EuiI18n token="yesDoIt" default="Yes, do it" />}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        >
          <p>
            <EuiI18n
              token="removeDictationConfirmation"
              default="Do you really want to remove the dictation?"
            />
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    ) : null


    if (hasNoTags) return (
      <EuiI18n token="noTranscripts" default="No transcripts found">
        {(noTranscriptsText) => (
          <div>
            <EuiFlexGroup>
              <EuiFlexItem style={{ maxWidth: '50%' }}>
                <EuiCallOut
                  title={noTranscriptsText}
                  iconType="pin"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}
      </EuiI18n>
    )

    return (
      <Fragment>
        <EuiText><h2>{departmentName}</h2></EuiText>
        <EuiSpacer size="s" />
        <EuiI18n token="enableAutorefresh" default="enableAutorefresh">
          {(enableAutorefreshText) => (
            <EuiSwitch
              label={enableAutorefreshText}
              checked={isAutorefreshEnabled}
              onChange={this.toggleAutorefresh}
            />
          )}
        </EuiI18n>
        <EuiSpacer size="l" />
        <EuiBasicTable
          pagination={pagination}
          columns={columns}
          noItemsMessage={
            <h4
              style={{
                textAlign: 'center',
                padding: '2em'
              }}
            >
              Loading ...
            </h4>
          }
          sorting={sorting}
          items={loading ? [] : transcripts}
          loading={!transcripts.length || loading}
          compressed={true}
          onChange={this.onTableChange}
        />
        {confirmModal}
      </Fragment>
    )
  }
}

TranscriptionList.propTypes = {
  activeDepartments: PropTypes.array,
  transcripts: PropTypes.array,
  job: PropTypes.any,
  fetchTranscripts: PropTypes.func,
  setPageIndex: PropTypes.func,
  contentLength: PropTypes.number,
  pageIndex: PropTypes.number.isRequired,
  hasNoTags:PropTypes.bool
}

TranscriptionList.defaultProps = {
  transcripts: [],
  job: []
}
