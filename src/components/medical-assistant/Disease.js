/* eslint-disable react/prop-types */
import React from 'react'
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui'
import DiseaseParams from './DiseaseParams'
import MedicalAssistantContext from '../../context/MedicalAssistantContext'

const Disease = ({ id, updateValue }) => {
  const updateParams = (p) => {
    updateValue(p)    
  }

  return (
    <EuiFlexGroup >
      <EuiFlexItem>          
        <MedicalAssistantContext.Consumer>
          {(assistanceData) => {
            return (
              <DiseaseParams 
                parameters={assistanceData[id].parameters} 
                selectedDisease={assistanceData[id].name} 
                updateParams={updateParams}
                nameFoundInContent={assistanceData[id].nameFoundInContent} 
                basedOnSymptom={assistanceData[id].basedOnSymptom}
              />
            )
          }}
        </MedicalAssistantContext.Consumer>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}

export default Disease
