import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  EuiButtonEmpty, EuiSpacer, EuiFieldText, EuiButtonIcon,
  EuiFlexGroup, EuiFlexItem, EuiText, EuiForm
} from '@elastic/eui'
import '../styles/editor.css'

const Info = ({ fields }) => {
  const [patientId, setPatientId] = useState(fields.patient_id)
  const [patientNamn, setPatientNamn] = useState(fields.patient_full_name)
  const [isPatientNameEditable, setIsPatientNameEditable] = useState(false)

  useEffect(() => {
    setPatientId(fields.patient_id)
    setPatientNamn(fields.patient_full_name)
  })

  function changePatientNameEditStatus() {
    setIsPatientNameEditable(isPatientNameEditable)
  }

  function onPatientNameChange(e) {
    setPatientNamn(e.target.value)
  }


  return (
    <EuiForm>
      <EuiFlexGroup>
        <EuiFlexItem>
          <div className="euiText euiText--small">
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
          <div className="euiText euiText--small">
            <div>
              <h2>
                <span>Patientnamn</span>
              </h2>
              <EuiText size="m">
                <span
                  style={{ display: isPatientNameEditable ? 'none' : 'flex' }}
                >
                  {patientNamn}
                  &nbsp;
                  <EuiButtonIcon
                    style={{ display: isPatientNameEditable ? 'none' : 'flex' }}
                    iconType="pencil"
                    aria-label="Next"
                    color="danger"
                    onClick={changePatientNameEditStatus}
                  />
                </span>
              </EuiText>
              <EuiFieldText
                style={{ display: isPatientNameEditable ? 'flex' : 'none' }}
                onChange={onPatientNameChange}
                value={patientNamn}
                placeholder={patientNamn}
                aria-label="Use aria labels when no actual label is in use"
              />
              <EuiSpacer size="s" />
              <EuiButtonEmpty
                style={{ display: isPatientNameEditable ? 'flex' : 'none' }}
                onClick={changePatientNameEditStatus}
              >
                Save
              </EuiButtonEmpty>
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
