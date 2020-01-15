/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState } from 'react'
import { EuiFieldText, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui'

const PersonalInformation = () => {
  const [name, setName] = useState('')
  const [personnummer, setPersonnummer] = useState('')

  const changeName = (e) => {
    setName(e.target.value)
  }

  const changePersonnummer = (e) => {
    setPersonnummer(e.target.value)
  }

  return (
    <EuiFormRow label="Patients information">
        <EuiFlexGroup>
          <EuiFlexItem style={{ minWidth: 400 }}>
            <EuiFieldText
              placeholder="Patients namn"
              value={name}
              onChange={changeName}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 400 }}> 
            <EuiFieldText
              fullWidth={true}
              placeholder="Personnummer"
              value={personnummer}
              onChange={changePersonnummer}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFlexItem>
        </EuiFlexGroup>  
    </EuiFormRow>
  )
}

export default PersonalInformation
