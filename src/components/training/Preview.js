// Used react synthetic event
import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { EuiText, EuiSpacer } from '@elastic/eui'
import '../../App.css'

const Preview = ({ contents, visible }) => (
  <Fragment>
    <EuiText style={{ display: visible ? 'flex' : 'none' }}>
      <h5>Förhandsvisning</h5>
    </EuiText>
    <EuiSpacer size="m" />
    <EuiText style={{ display: visible ? 'flex' : 'none' , width: 760 }}>
      <pre>
        <code>{contents}</code>
      </pre>
    </EuiText>
    <EuiSpacer size="m" />
  </Fragment>
)

Preview.propTypes = {
  contents: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired
}

export default Preview
