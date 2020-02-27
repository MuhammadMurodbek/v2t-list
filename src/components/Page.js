import React from 'react'
import {
  EuiPageBody, EuiPageContent, EuiPageContentHeader,
  EuiPageContentHeaderSection, EuiText, EuiPageContentBody
} from '@elastic/eui'
import PropTypes from 'prop-types'
import Preferences from './Preferences'

const Start = ({ title, logo, children, preferences }) => (
  <EuiPageBody style={{
    minHeight: '100vh',
    margin: '0px',
    paddingLeft: '0px'
  }}>
    <EuiPageContent style={{ borderRadius: 0 }}>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiText>
            <h2>{title}</h2>
          </EuiText>
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
