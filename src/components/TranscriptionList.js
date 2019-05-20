import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { EuiInMemoryTable } from '@elastic/eui'

import { PreferenceContext } from './PreferencesProvider'

export default class TranscriptionList extends Component {

  static contextType = PreferenceContext

  render() {
    const { transcripts } = this.props
    const [ preferences ] = this.context

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
