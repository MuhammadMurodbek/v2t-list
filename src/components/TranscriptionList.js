import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { EuiInMemoryTable, EuiButtonIcon, EuiButtonEmpty } from '@elastic/eui'
import { PreferenceContext } from './PreferencesProvider'
import api from '../api'
import swal from 'sweetalert'

import '@elastic/eui/dist/eui_theme_light.css'

export default class TranscriptionList extends Component {
  static contextType = PreferenceContext

  state = {
    items: [],
    edited: false,
    previousJob: null
  }

  componentDidMount = async () => {
    document.title = 'Inovia AI :: All Transcripts'
  }

  
  updateItems = (id) => {
    const { items, edited } = this.state
    this.setState({ items: items.filter(item => item.id !== id), edited: true })
  }

  render() {
    const { transcripts, job } = this.props
    const { items, edited, previousJob} = this.state
    if ((transcripts.length !== items.length && edited === false) || (job !== previousJob)) {
      this.setState({ items: transcripts, previousJob: job})
    }
    const [preferences] = this.context
    const pagination = {
      initialPageSize: 20,
      pageSizeOptions: [20, 50, 100]
    }

    const columns = [...preferences.columnsForTranscriptList,
      {
        label: 'Öppna',
        field: 'external_id',
        name: '',
        width: '100px',
        render: external_id => <EuiButtonEmpty href={`/#edit/${external_id}`}>Öppna</EuiButtonEmpty>,
        disabled: true
      },
      {
        label: 'Ta bort',
        field: 'id',
        name: '',
        disabled: true,
        width: '100px',
        render: id =>
          <EuiButtonIcon
            color="danger"
            iconType="trash"
            onClick={() => {
              swal({
                title: 'Vill du verkligen ta bort diktatet?',
                text: '',
                icon: 'warning',
                buttons: ['Avbryt', 'OK'],
                dangerMode: true
              })
                .then((willDelete) => {
                  api.rejectTranscription(id)
                  if (willDelete) {
                    swal('Diktatet tas bort!', {
                      icon: 'success'
                    })
                    this.updateItems(id)
                  }
                })
            }} />
      }]

    return (
      <Fragment>
        <EuiInMemoryTable
          pagination={pagination}
          columns={columns}
          items={items}
          compressed={true}
        />
      </Fragment>
    )
  }
}

TranscriptionList.propTypes = {
  transcripts: PropTypes.array
}

TranscriptionList.defaultProps = {
  transcripts: []
}
