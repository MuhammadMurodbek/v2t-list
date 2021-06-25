/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { EuiText, EuiTextColor } from '@patronum/eui'

const HeaderLine = ({ header, updatedHeader }) => {
  if (header === updatedHeader) {
    return (
      <EuiText size="m">
        <b>{header}</b>
      </EuiText>
    )
  } else {
    return (
      <EuiText size="m">
        {header && (
          <b>
            <EuiTextColor color="danger" style={{ background: '#BD271E30' }}>
              {header}
            </EuiTextColor>{' '}
          </b>
        )}
        {updatedHeader && (
          <b>
            <EuiTextColor color="secondary" style={{ background: '#017D7330' }}>
              {updatedHeader}
            </EuiTextColor>
          </b>
        )}
      </EuiText>
    )
  }
}

HeaderLine.propTypes = {
  header: PropTypes.string,
  updatedHeader: PropTypes.string
}

export default HeaderLine
