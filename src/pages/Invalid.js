import React from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiTextAlign, EuiText
} from '@elastic/eui'
import Page from '../components/Page'
import '../styles/pageNotFound.css'


const Invalid = () => {
  return (
    <div>
      <div id="land">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTextAlign textAlign="center">
              <EuiText>
                <h1 style={{ marginTop: '50vh',fontSize: '50px', color: 'white' }}>
                  Sidan kunde inte hittas
                </h1>
              </EuiText>
            </EuiTextAlign>
                      
            <EuiTextAlign textAlign="center">
              <EuiText>
                <div>
                  <a href="/" className="whiteLink">Tillbaka</a>
                </div>
              </EuiText>
            </EuiTextAlign>
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
        <div id="ground">
        
      </div>
      </div>
      </div>
    
    
  )
}

export default Invalid