/* eslint-disable react/prop-types */
import React, { useState, useEffect, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiText,
  EuiI18n
} from '@patronum/eui'
import validatePersonnummer from '../models/live/validatePersonnummer'

const PersonalInformation = ({ info, updateDoktorsNamn, updatePatientsNamn, updatePatientsPersonnummer, updateDepartmentId }) => {
  const [doktor, setDoktor] = useState('')
  const [patient, setPatient] = useState('')
  const [personnummer, setPersonnummer] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  useEffect(() => {
    if (info) {
      if (info.doktor) {
        if (
          doktor === '' &&
          doktor.toLowerCase().trim() !== info.doktor.toLowerCase().trim()
        ) {
          setDoktor(info.doktor)
        }
      }
      if (info.patient) {
        if (
          patient === '' &&
          patient.toLowerCase().trim() !== info.patient.toLowerCase().trim()
        ) {
          setPatient(info.patient)
        }
      }
      if (info.personnummer) {
        if (
          personnummer === '' &&
          personnummer.toLowerCase().trim() !==
            info.personnummer.toLowerCase().trim()
        ) {
          setPersonnummer(organizePersonummer(info.personnummer))
        }
      }
      if (info.departmentId) {
        if (
          departmentId === '' &&
          departmentId.toLowerCase().trim() !==
          info.departmentId.toLowerCase().trim()
        ) {
          setDepartmentId(info.departmentId)
        }
      }
    }
  })

  const organizePersonummer = (nummer) => {
    let updatedNummer = nummer.trim()
    updatedNummer = updatedNummer.replace(/\s/g, '')
    if (updatedNummer.length === 10) {
      return `${updatedNummer.substr(0, 6)}-${updatedNummer.substr(-4)}`
    } else if (updatedNummer.length === 12) {
      return `${updatedNummer.substr(0, 8)}-${updatedNummer.substr(-4)}`
    } else {
      return updatedNummer
    }
  }

  const onChangeDoktor = (e) => {
    setDoktor(e.target.value)
    updateDoktorsNamn(e.target.value)
  }
  const onChangePatient = (e) => {
    setPatient(e.target.value)
    updatePatientsNamn(e.target.value)
  }
  const onChangePersonnummer = (e) => {
    setPersonnummer(e.target.value)
    updatePatientsPersonnummer(e.target.value)
  }
  
  const onChangeDepartmentId = (e) => {
    setDepartmentId(e.target.value)
    updateDepartmentId(e.target.value)
  }

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
                value={doktor}
                onChange={onChangeDoktor}
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
                value={patient}
                onChange={onChangePatient}
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
                    validatePersonnummer(personnummer).status === false
                      ? '1px red solid'
                      : 'none'
                }}
                placeholder={translation}
                value={personnummer}
                onChange={onChangePersonnummer}
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
                value={departmentId}
                onChange={onChangeDepartmentId}
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
