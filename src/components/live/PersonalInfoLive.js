import React, { useState, useEffect, Fragment } from 'react'
import {
  EuiFlexGroup, EuiFlexItem,
  EuiFieldText, EuiText, EuiSpacer
} from '@elastic/eui'
import validatePersonnummer from '../../models/live/validatePersonnummer'

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
          setPersonnummer(organizePersonummer(info.personnummer))
        }
      }
    }
  })

  const organizePersonummer = (nummer) => {
    let updatedNummer = nummer.trim()
    updatedNummer = updatedNummer.replace(/\s/g, '')
    if (updatedNummer.length === 10) {
      return `${updatedNummer.substr(0,6)}-${updatedNummer.substr(-4)}`
    } else if (updatedNummer.length === 12) {
      return `${updatedNummer.substr(0, 8)}-${updatedNummer.substr(-4)}`
    } else {
      return updatedNummer
    }
  } 

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
            style={{ border: validatePersonnummer(personnummer).status === false ? '1px red solid': 'none'}}
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