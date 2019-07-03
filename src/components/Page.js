import React from 'react'
import {
  EuiPageBody, EuiPageContent, EuiPageContentHeader,
  EuiPageContentHeaderSection, EuiTitle, EuiPageContentBody
} from '@elastic/eui'
import PropTypes from 'prop-types'
import Preferences from './Preferences'

const Start = ({ title, children, preferences }) => (
  <EuiPageBody style={{ minHeight: '100vh', margin: '-16px', paddingLeft: '16px' }}>
    <EuiPageContent style={{ borderRadius: 0 }}>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
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
  preferences: PropTypes.bool.isRequired
}

export default Start
