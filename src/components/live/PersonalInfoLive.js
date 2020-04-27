/* eslint-disable react/prop-types */
import React, { useState, useEffect, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiText,
  EuiSpacer,
  EuiI18n
} from '@elastic/eui'
import validatePersonnummer from '../../models/live/validatePersonnummer'

const PersonalInfoLive = ({ info }) => {
  const [doktor, setDoktor] = useState('')
  const [patient, setPatient] = useState('')
  const [personnummer, setPersonnummer] = useState('')

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
  }
  const onChangePatient = (e) => {
    setPatient(e.target.value)
  }
  const onChangePersonnummer = (e) => {
    setPersonnummer(e.target.value)
  }

  return (
    <Fragment>
      <EuiFlexGroup style={{ width: 250 }}>
        <EuiFlexItem>
          <EuiSpacer size="m" />
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
                aria-label="Use aria labels when no actual label is in use"
              />
            )}
          </EuiI18n>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup style={{ width: 500 }}>
        <EuiFlexItem>
          <EuiSpacer size="m" />
          <EuiText>
            <h6>Patient</h6>
          </EuiText>
          <EuiFieldText
            placeholder="Patients Namn"
            value={patient}
            onChange={onChangePatient}
            aria-label="Use aria labels when no actual label is in use"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer size="m" />
          <EuiText>
            <h6>
              <EuiI18n token="patient" default="Patient" />
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
              />
            )}
          </EuiI18n>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default PersonalInfoLive
