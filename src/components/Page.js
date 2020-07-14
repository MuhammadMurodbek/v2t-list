import React from 'react'
import {
  EuiPageBody, EuiPageContent, EuiPageContentHeader,
  EuiPageContentHeaderSection, EuiPageContentBody,
  EuiTitle
} from '@patronum/eui'
import PropTypes from 'prop-types'
import Preferences from './Preferences'

const Start = ({ title, logo, children, preferences }) => (
  <EuiPageBody style={{
    minHeight: '100vh',
    margin: '0px',
    paddingLeft: '0px'
  }}
  className="pageBody">
    <EuiPageContent style={{ borderRadius: 0 }}>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle size="l">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {preferences ? <Preferences /> : null}
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        {children}
      </EuiPageContentBody>
    </EuiPageContent>
  </EuiPageBody>
)

Start.propTypes = {
  title: PropTypes.string.isRequired,
  // children: PropTypes.object.isRequired,
  // children: PropTypes.oneOf(['object', 'array']).isRequired,
  // preferences: PropTypes.bool.isRequired
}

export default Start
