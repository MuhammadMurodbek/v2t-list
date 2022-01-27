/* eslint-disable max-len */
import React from 'react'
import { EuiI18n, EuiText } from '@inoviaab/eui'

const MedicalAssistantRowHeader = ({ item, data }) => {  
  return data.map((disease, i) => {
    if (disease.name === item && disease.basedOnSymptom === false) {
      return (
        <EuiText key={`${item}-${i}`}>
          <span className="medicalAssistant firstLetterUpperCase" style={{ fontWeight: 600 }}>{item}&nbsp;</span>
          <span className="medicalAssistant">
            <EuiI18n
              token="missingInforMationTitle"
              default="is mentioned"
            />
          </span>
        </EuiText>
      ) 
    }
    else if (disease.name === item && disease.basedOnSymptom === true) {
      return (
        <EuiText key={`${item}-${i}`}>
          <span
            className="medicalAssistant"
            style={{ textTransform: 'capitalize', color: 'darkgreen', fontWeight: 600 }}
          >
            {item}&nbsp;
          </span>
          <span className="medicalAssistant" style={{ color: 'darkgreen' }}>
            <EuiI18n
              token="basedOnSymptom"
              default="is recognized as symptom"
            />{' '}
                &nbsp;
          </span>
        </EuiText>
      ) 
    }
  })
}

export default MedicalAssistantRowHeader
