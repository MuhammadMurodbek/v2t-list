import React from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiForm,
  EuiBasicTable,
  EuiSpacer
} from '@patronum/eui'
import '../styles/editor.css'
import '../styles/tags.css'
import { EuiI18n } from '@patronum/eui'

const Info = ({ fields }) => {
  if (!fields.patient_full_name && !fields.patient_id) return null

  const items = [
    {
      patientNamn: fields.patient_full_name || '',
      patientId: fields.patient_id || ''
    }
  ]

  return (
    <EuiForm style={{ display: fields.patient_id === '' ? 'none' : 'block' }}>
      <div className="euiText euiText--small">
        <div>
          <EuiText size="xs">
            <h2>
              <EuiI18n token="information" default="Information" />
            </h2>
          </EuiText>
        </div>
      </div>
      <EuiSpacer size="m" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            className="transcript"
            items={items}
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

const COLUMNS = [
  {
    field: 'patientNamn',
    name: <EuiI18n token="patientsName" default="Patient's name" />,
    sortable: true
  },
  {
    field: 'patientId',
    name: (
      <EuiI18n
        token="patientsPersonalNumber"
        default="Patient's personal number"
      />
    )
  }
]

export default Info
