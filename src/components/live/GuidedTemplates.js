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
import SectionHeadersList from './SectionHeadersList'

const GuidedTemplates = ({ listOfTemplates, updatedTemplateIndex }) => {
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0)    

  return (
    <Fragment>
      <EuiText>
        <h2>
          Säg/Välj Journalmalls namn, säg Nästa" eller "Tillbaka" efter namnet.
        </h2>
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
                      updatedTemplateIndex(i)
                    }
                  }
                  isActive={activeTemplateIndex === i}
                />)
            })}      
          </EuiListGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer size="m" />
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
