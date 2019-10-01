import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup, EuiFlexItem, EuiText, EuiForm
} from '@elastic/eui'
import '../styles/editor.css'

const Info = ({ fields }) => {
  const [patientId, setPatientId] = useState(fields.patient_id)
  const [patientNamn, setPatientNamn] = useState(fields.patient_full_name)
  const [propsNotLoaded, setPropsNotLoaded] = useState(true)

  useEffect(() => {
    if (propsNotLoaded && (fields.patient_id !== '' || fields.patient_full_name !== '')) {
      setPatientId(fields.patient_id)
      setPatientNamn(fields.patient_full_name)
      setPropsNotLoaded(false)
    }
  })


  return (
    <EuiForm>
      <EuiFlexGroup>
        <EuiFlexItem>
          <div className="euiText euiText--small" style={{ display: patientId === '' ? 'none' : 'flex' }}>
            <div>
              <h2>
                <span> Personnummer</span>
              </h2>
              <EuiText size="m">
                <span>
                  {patientId}
                </span>
              </EuiText>
            </div>
          </div>
        </EuiFlexItem>
        <EuiFlexItem>
          <div className="euiText euiText--small" style={{ display: patientId === '' ? 'none' : 'flex' }}>
            <div>
              <h2>
                <span>Patientnamn</span>
              </h2>
              <EuiText size="m">
                <span>
                  {patientNamn}
                </span>
              </EuiText>
            </div>
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiForm>
  )
}

Info.propTypes = {
  fields: PropTypes.object
}

Info.defaultProps = {
  fields: {
    patient_id: '',
    patient_full_name: ''
  }
}

export default Info
