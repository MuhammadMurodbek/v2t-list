// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiText, EuiSpacer } from '@elastic/eui'
import '../../App.css'

const Preview = ({ contents, visible }) => (
  <Fragment>
    {/* <EuiText style={{ display: visible ? 'flex' : 'none' }}> */}
    <EuiText>
      
      <h5>Preview</h5>
      <EuiSpacer size="l" />
      <EuiSpacer size="s" />
      <pre>
        <code>{contents}</code>
      </pre>
    </EuiText>
  </Fragment>
)

export default Preview
