import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { EuiBasicTable, EuiButtonIcon, EuiButtonEmpty } from '@patronum/eui'
import { PreferenceContext } from './PreferencesProvider'
import api from '../api'

import { EuiI18n, EuiConfirmModal, EuiOverlayMask } from '@patronum/eui'
import { addUnexpectedErrorToast, addSuccessToast } from './GlobalToastList'

export default class TranscriptionList extends Component {
  static contextType = PreferenceContext

  constructor(props) {
    super(props)
    this.state = {
      pageSize: 20,
      loading: false,
      isConfirmModalVisible: false,
      dictationToRemove: null,
      sortField: 'createdTime',
      sortDirection: 'desc'
    }
  }

  componentDidMount = async () => {
    const { setTranscriptId } = this.context

    setTranscriptId('')
    document.title = 'Inovia AI :: All Transcripts'
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

  render() {
    const {
      pageSize,
      loading,
      isConfirmModalVisible,
      sortField,
      sortDirection
    } = this.state
    const { transcripts, contentLength, pageIndex } = this.props
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
    const columns = [
      ...preferences.columnsForTranscriptList,
      {
        label: <EuiI18n token="open" default="Open" />,
        field: 'id',
        name: '',
        width: '100px',
        render: (schemaId) => (
          <EuiButtonEmpty
            {...this.getTranscriptHref(schemaId)}
          >
            <EuiI18n token="open" default="Open" />
          </EuiButtonEmpty>
        ),
        disabled: true
      },
      {
        label: 'Ta bort',
        field: 'id',
        name: '',
        disabled: true,
        width: '100px',
        render: (id) => (
          <EuiButtonIcon
            color="danger"
            iconType="trash"
            aria-label="Delete"
            onClick={() => this.showConfirmModal(id)}
          />
        )
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

    return (
      <Fragment>
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
  transcripts: PropTypes.array,
  job: PropTypes.any,
  fetchTranscripts: PropTypes.func,
  setPageIndex: PropTypes.func,
  contentLength: PropTypes.number,
  pageIndex: PropTypes.number.isRequired
}

TranscriptionList.defaultProps = {
  transcripts: [],
  job: []
}
