/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, Fragment } from 'react'
import { EuiFieldText, EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiFormRow } from '@elastic/eui'

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
    <EuiFormRow label="Skriv information">
        <Fragment>
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiFieldText
          placeholder="Patients namn"
          value={name}
          onChange={changeName}
          aria-label="Use aria labels when no actual label is in use"
        />
      </EuiFlexItem>
    </EuiFlexGroup>  
    <EuiSpacer size="s" />
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiFieldText
          placeholder="Patients Id"
          value={personnummer}
          onChange={changePersonnummer}
          aria-label="Use aria labels when no actual label is in use"
        />
      </EuiFlexItem>
    </EuiFlexGroup>  
          </Fragment>
    </EuiFormRow>
  )
}

export default PersonalInformation
