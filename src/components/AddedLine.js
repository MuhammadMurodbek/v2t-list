/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { EuiTextColor } from '@inoviaab/eui'

const AddedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="secondary">+ </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="secondary" style={{ background: '#017D7330' }}>
      {diff[1]}
    </EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)

AddedLine.propTypes = {
  diff: PropTypes.array,
  prevDiff: PropTypes.array,
  nextDiff: PropTypes.array
}

export default AddedLine
