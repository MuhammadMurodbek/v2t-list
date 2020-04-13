import React from 'react'
import { EuiFlexGroup, EuiFlexItem, EuiTextAlign, EuiText } from '@elastic/eui'
import '../styles/pageNotFound.css'
import { EuiI18n } from '@elastic/eui'

const Invalid = () => {
  return (
    <div className="land-wrapper">
      <div id="land">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiI18n
              tokens={['thePageCouldNotBeFound', 'back']}
              defaults={['The page could not be found', 'Back']}
            >
              {([thePageCouldNotBeFound, back]) => (
                <>
                  <EuiTextAlign textAlign="center">
                    <EuiText>
                      <h1
                        style={{
                          marginTop: '50vh',
                          fontSize: '50px',
                          color: 'white'
                        }}
                      >
                        {thePageCouldNotBeFound}
                      </h1>
                    </EuiText>
                  </EuiTextAlign>

                  <EuiTextAlign textAlign="center">
                    <EuiText style={{ marginTop: 30 }}>
                      <div>
                        <a href="/" className="whiteLink">
                          {back}
                        </a>
                      </div>
                    </EuiText>
                  </EuiTextAlign>
                </>
              )}
            </EuiI18n>
          </EuiFlexItem>
        </EuiFlexGroup>
        <div id="fire">
          <div className="flame"></div>
          <div className="flame"></div>
          <div className="flame"></div>
          <div className="flame"></div>
          <div className="flame"></div>
          <div id="logs">
            <div id="logOne"></div>
            <div id="logTwo"></div>
            <div id="flicker"></div>
          </div>
        </div>
        <div id="ground"></div>
      </div>
    </div>
  )
}

export default Invalid
