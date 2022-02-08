import React from 'react'
import {
  EuiI18n
} from '@elastic/eui'

const MedicalAssistantTitle = () => {
  if (localStorage.getItem('decisionSupportStatus') === 'true') {
    return (
      <EuiI18n
        token="Beslutstödsassistent"
        default="Decision Support Assistant"
      />
    )
  } else if (localStorage.getItem('codingSupportStatus') === 'true') {
    return (
      <EuiI18n
        token="Kodningsassistent"
        default="Coding Support Assistant"
      />
    )
  } else {
    return (
      <EuiI18n
        token="medicinskAssistent"
        default="Medical Assistant"
      />
    )
  }
}

export default MedicalAssistantTitle
