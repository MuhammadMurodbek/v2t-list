/* eslint-disable react/prop-types */
import React, { Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiText,
  EuiI18n
} from '@patronum/eui'
import validatePersonnummer from '../models/live/validatePersonnummer'

const PersonalInformation = ({ info, updateDoktorsNamn, updatePatientsNamn, updatePatientsPersonnummer, updateDepartmentId }) => {
  return (
    <Fragment>
      <EuiFlexGroup style={{ width: 250 }}>
        <EuiFlexItem>
          <EuiText>
            <h6>
              <EuiI18n token="doctor" default="Doctor" />
            </h6>
          </EuiText>

          <EuiI18n token="doctorsName" default="Doctor's Name">
            {(translation) => (
              <EuiFieldText
                placeholder={translation}
                value={info.doktor}
                onChange={e => updateDoktorsNamn(e.target.value)}
              />
            )}
          </EuiI18n>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup style={{ width: 500 }}>
        <EuiFlexItem>
          <EuiText>
            <h6>
              <EuiI18n token="patient" default="Patient" />
            </h6>
          </EuiText>

          <EuiI18n token="patientsName" default="Patient's Name">
            {(translation) => (
              <EuiFieldText
                placeholder={translation}
                value={info.patient}
                onChange={e => updatePatientsNamn(e.target.value)}
              />
            )}
          </EuiI18n>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h6>
              <EuiI18n token="personalNumber" default="Personal number" />
            </h6>
          </EuiText>

          <EuiI18n
            token="patientsPersonalNumber"
            default="Patient's personal number"
          >
            {(translation) => (
              <EuiFieldText
                style={{
                  border:
                    validatePersonnummer(info.personnummer).status === false
                      ? '1px red solid'
                      : 'none'
                }}
                placeholder={translation}
                value={info.personnummer}
                onChange={e => updatePatientsPersonnummer(e.target.value)}
                aria-label="Use aria labels when no actual label is in use"
              />
            )}
          </EuiI18n>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>

          <EuiText>
            <h6>
              <EuiI18n token="departmentId" default="Department Id" />
            </h6>
          </EuiText>

          <EuiI18n
            token="departmentId"
            default="Department Id"
          >
            {(translation) => (
              <EuiFieldText
                placeholder={translation}
                value={info.departmentId}
                onChange={e => updateDepartmentId(e.target.value)}
                aria-label="Use aria labels when no actual label is in use"
              />
            )}
          </EuiI18n>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default PersonalInformation
