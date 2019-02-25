import React from 'react'
import { EuiPageBody, EuiPageContent, EuiPageContentHeader,
  EuiPageContentHeaderSection, EuiTitle, EuiPageContentBody } from '@elastic/eui'

const Start = ({ title, children }) => (
  <EuiPageBody style={{ minHeight: '100vh', margin: '-16px', paddingLeft: '16px' }}>
    <EuiPageContent style={{ borderRadius: 0 }}>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>{title}</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        {children}
      </EuiPageContentBody>
    </EuiPageContent>
  </EuiPageBody>
)

export default Start
