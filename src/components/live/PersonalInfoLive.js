import React, { useState, useEffect, Fragment } from 'react'
import {
  EuiFlexGroup, EuiFlexItem,
  EuiFieldText, EuiText, EuiSpacer
} from '@elastic/eui'

const PersonalInfoLive = ({ info }) => {
  const [doktor, setDoktor] = useState('')
  const [patient, setPatient] = useState('')
  const [personnummer, setPersonnummer] = useState('')
  
  useEffect(()=>{
    if (info) {
      if (info.doktor) {
        if (
          doktor === '' 
          && (doktor.toLowerCase().trim() !== info.doktor.toLowerCase().trim())
        ) {
          setDoktor(info.doktor)
        }
      }
      if (info.patient) {
        if (
          patient === '' 
          && (patient.toLowerCase().trim() !== info.patient.toLowerCase().trim())
        ) {
          setPatient(info.patient)
        }
      }
      if (info.personnummer) {
        if (
          personnummer === ''
          && (personnummer.toLowerCase().trim() 
              !== info.personnummer.toLowerCase().trim())
        ) {
          setPersonnummer(info.personnummer)
        }
      }
    }
  })

  const onChangeDoktor=(e)=>{
    console.log(e.target.value)
    setDoktor(e.target.value)
  }
  const onChangePatient=(e)=>{
    setPatient(e.target.value)
  }
  const onChangePersonnummer=(e)=>{
    setPersonnummer(e.target.value)
  }
  
  return (
    <Fragment>
      <EuiFlexGroup style={{ width: 250 }}>
        <EuiFlexItem>
          <EuiSpacer size="m" />
          <EuiText>
            <h6>Doctor</h6>
          </EuiText>
          <EuiFieldText
            placeholder="Doctors Namn"
            value={doktor}
            onChange={onChangeDoktor}
            aria-label="Use aria labels when no actual label is in use"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup style={{width: 500}}>
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
            <h6>Personnummer</h6> 
          </EuiText>
          <EuiFieldText
            placeholder="Patients Personummer"
            value={personnummer}
            onChange={onChangePersonnummer}
            aria-label="Use aria labels when no actual label is in use"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default PersonalInfoLive