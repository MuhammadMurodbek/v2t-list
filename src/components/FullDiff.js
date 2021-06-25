/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { EuiText, EuiSpacer } from '@patronum/eui'

const FullDiff = ({ diff }) => {
  if (diff === null || diff.length === 0) return null
  return (
    <>
      <EuiSpacer size="xl" />
      <EuiSpacer size="xl" />
      <EuiText>
        <h6>&nbsp;&nbsp;&nbsp;&nbsp;Diff</h6>
      </EuiText>
      <code className="fullDiffArea">{diff}</code>
      <EuiSpacer size="xl" />
    </>
  )
}

FullDiff.propTypes = {
  diff: PropTypes.array
}

export default FullDiff
