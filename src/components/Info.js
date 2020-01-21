import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup, EuiFlexItem, EuiText, EuiForm, EuiBasicTable, EuiSpacer
} from '@elastic/eui'
import '../styles/editor.css'
import '../styles/tags.css'

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

  const metaData = [{
    patientNamn,
    patientId
  }]


  const COLUMNS = [
    {
      field: 'patientNamn',
      name: 'Patientnamn',
      sortable: true,
      width: '190px'
    },
    {
      field: 'patientId',
      name: 'Personnummer',
      width: '110px'
    }]

  
  return (
    <EuiForm style={{ display: patientId === '' ? 'none' : 'block' }}>
      <div className="euiText euiText--small">
        <div>
          <EuiText size="xs">
            <h2>Information</h2>
          </EuiText>
        </div>
      </div>
      <EuiSpacer size="m" />
      <EuiFlexGroup>
        <EuiFlexItem grow={false} style={{ width: 380 }}>
          <EuiBasicTable
            className="transcript"
            items={metaData}
            columns={COLUMNS}
            hasActions
          />
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
