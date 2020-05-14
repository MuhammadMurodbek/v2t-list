import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { EuiBasicTable, EuiButtonIcon, EuiButtonEmpty } from '@elastic/eui'
import { PreferenceContext } from './PreferencesProvider'
import api from '../api'
import swal from 'sweetalert'

import '@elastic/eui/dist/eui_theme_light.css'
import { EuiI18n } from '@elastic/eui'
import { addErrorToast } from './GlobalToastList'

export default class TranscriptionList extends Component {
  static contextType = PreferenceContext

  state = {
    edited: false,
    pageIndex: 0,
    pageSize: 20,
    loading: false
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: All Transcripts'
  }

  updateItems = (id) => {
    const { items } = this.state
    this.setState({
      items: items.filter((item) => item.id !== id),
      edited: true
    })
  }

  onTableChange = async ({ page = {} }) => {
    const { index: pageIndex, size: pageSize } = page
    const { fetchTranscripts, setPageIndex, job } = this.props
    this.setState({
      loading: true
    })

    await fetchTranscripts(job, pageIndex, pageSize)

    this.setState({
      pageSize,
      loading: false
    })
    setPageIndex(pageIndex)
  }

  shouldComponentUpdate({ transcripts: nextTranscripts, job: nextJob }) {
    const { transcripts, job } = this.props
    const { edited } = this.state
    if (
      (transcripts.length !== nextTranscripts.length && edited === false) ||
      job !== nextJob
    ) {
      return true
    }
    return false
  }

  render() {
    localStorage.setItem('transcriptId', '')
    const { pageSize, loading } = this.state
    const { transcripts, contentLength, pageIndex } = this.props
    const [preferences] = this.context
    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: contentLength,
      pageSizeOptions: [20, 50, 100]
    }

    const columns = [
      ...preferences.columnsForTranscriptList,
      {
        label: 'Öppna',
        field: 'external_id',
        name: '',
        width: '100px',
        render: (external_id) => (
          <EuiButtonEmpty href={`/#edit/${external_id}`}>
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
            onClick={() => {
              swal({
                title: 'Vill du verkligen ta bort diktatet?',
                text: '',
                icon: 'warning',
                buttons: ['Avbryt', 'OK'],
                dangerMode: true
              }).then((willDelete) => {
                api.rejectTranscription(id).catch(() => {
                  addErrorToast()
                })
                if (willDelete) {
                  swal('Diktatet tas bort!', {
                    icon: 'success'
                  })
                  this.updateItems(id)
                }
              })
            }}
          />
        )
      }
    ]

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
          items={loading ? [] : transcripts}
          loading={!transcripts.length || loading}
          compressed={true}
          onChange={this.onTableChange}
        />
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
