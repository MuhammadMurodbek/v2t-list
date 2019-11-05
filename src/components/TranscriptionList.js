import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { EuiInMemoryTable, EuiSearchBar, EuiSpacer } from '@elastic/eui'
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
      <Fragment>
      <EuiSearchBar
        box={{
          placeholder: 'Sök ...'
        }}
        onChange={()=> {}}
      />
      <EuiSpacer size="l" />
      <EuiInMemoryTable
        pagination
        columns={preferences.columns}
        items={transcripts}
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
