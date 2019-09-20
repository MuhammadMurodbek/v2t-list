import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { EuiInMemoryTable } from '@elastic/eui'
import { PreferenceContext } from './PreferencesProvider'
import '@elastic/eui/dist/eui_theme_light.css'

export default class TranscriptionList extends Component {
  static contextType = PreferenceContext

  componentDidMount = async () => {
    document.title = 'Inovia AI :: All Transcripts'
  }

  render() {
    const { transcripts } = this.props
    const [preferences] = this.context

    return (
      <EuiInMemoryTable
        pagination
        sorting={{ sort: { field: 'created', direction: 'desc' } }}
        columns={preferences.columns}
        items={transcripts}
        search={{ onChange: () => {} }}
      />
    )
  }
}

TranscriptionList.propTypes = {
  transcripts: PropTypes.array
}

TranscriptionList.defaultProps = {
  transcripts: []
}
