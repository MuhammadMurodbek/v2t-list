import React, { useState } from 'react'

import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiButton,
  EuiText,
  EuiTitle
} from '@patronum/eui'

const Flyout = () => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false)
  const flyout = () => (isFlyoutVisible ? 
    (<EuiFlyout
      ownFocus
      onClose={() => setIsFlyoutVisible(false)}
      aria-labelledby="flyoutTitle"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id="flyoutTitle">A typical flyout</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiText>
          <p>
            For consistency across the many flyouts, please utilize the
            following code for implementing the flyout with a header.
          </p>
        </EuiText>
      </EuiFlyoutBody>
    </EuiFlyout>) : (<></>)
  )
  return (
    <div>
      <EuiButton onClick={() => setIsFlyoutVisible(true)}>
        Show flyout
      </EuiButton>
      {flyout}
    </div>
  )
}

export default Flyout
