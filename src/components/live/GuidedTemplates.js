/* eslint-disable react/prop-types */
// Used react synthetic event
import React, { Fragment, useState } from 'react'
import {
  EuiSpacer,
  EuiListGroup,
  EuiListGroupItem,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText
} from '@elastic/eui'
import '../../App.css'
import SectionHeadersList from './SectionHeadersList'

const GuidedTemplates = ({ listOfTemplates }) => {
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0)    

  // Similar to componentDidMount and componentDidUpdate:
  return (
    <Fragment>
      <EuiText>
        <h2>Säg/Välj Journalmalls namn, säg Nästa" eller "Tillbaka" efter namnet.</h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiSpacer size="m" />
          <EuiText>
            <h2>Journalmallar</h2>
            <EuiSpacer size="m" />
          </EuiText>
          <EuiListGroup
            flush={true}
            bordered={false}
            style={{ overflowX: 'auto', height: 700 }}
          >
            {listOfTemplates.map((template, i) => {
              return (
                <EuiListGroupItem
                  id={template.id}
                  key={template.id}
                  label={template.name}
                  onClick={
                    () => {
                      setActiveTemplateIndex(i)
                    }
                  }
                  isActive={activeTemplateIndex === i}
                />)
            })}      
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h2>Sökord</h2>
            <EuiSpacer size="m" />
          </EuiText>
          <SectionHeadersList
            headers={
              listOfTemplates[activeTemplateIndex] ? 
                listOfTemplates[activeTemplateIndex].sections : []
            }
          />    
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default GuidedTemplates
