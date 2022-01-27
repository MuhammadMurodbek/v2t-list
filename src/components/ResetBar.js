import React from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiBottomBar,
  EuiButtonEmpty
} from '@inoviaab/eui'

const ResetBar = ({ showCancelBar, showHideCancelBox, resetState }) => (
  <EuiBottomBar
    style={showCancelBar === false ? { display: 'none' } : { display: 'flex' }}
  >
    <EuiFlexGroup justifyContent="flexEnd">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="xl">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              color="ghost"
              size="l"
              iconType="cross"
              onClick={showHideCancelBox}
            >
              Leave as it is
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              color="danger"
              fill
              size="l"
              iconType="check"
              onClick={resetState}
            >
              Reset all the changes
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiBottomBar>
)

ResetBar.propTypes = {
  showCancelBar: PropTypes.bool.isRequired,
  showHideCancelBox: PropTypes.func.isRequired,
  resetState: PropTypes.func.isRequired
}

export default ResetBar
