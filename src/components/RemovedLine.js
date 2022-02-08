/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { EuiTextColor } from '@elastic/eui'

const RemovedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="danger">- </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="danger" style={{ background: '#BD271E30' }}>
      {diff[1]}
    </EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)

RemovedLine.propTypes = {
  diff: PropTypes.array,
  prevDiff: PropTypes.array,
  nextDiff: PropTypes.array
}

export default RemovedLine
