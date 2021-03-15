import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { EuiForm, EuiFormRow, EuiComboBox, EuiI18n } from '@patronum/eui'
import '../App.css'

const Departments = ({ departments, departmentId, onUpdate }) => {
  const options = departments.map((department) => ({
    ...department,
    value: department.id,
    label: department.name
  }))
  const department = options.find((t) => t.value === departmentId) || {
    label: ''
  }

  const onDepartmentChange = (departments) => {
    if (!departments.length) return
    const department = departments[0]
    onUpdate(department.value)
  }

  return (
    <Fragment>
      <EuiForm>
        <EuiFormRow
          label={
            <EuiI18n token="selectDepartment" default="Select department" />
          }
        >
          <EuiComboBox
            options={options}
            selectedOptions={[department]}
            singleSelection={{ asPlainText: true }}
            onChange={onDepartmentChange}
            isClearable={false}
          /> 
        </EuiFormRow>
      </EuiForm>
    </Fragment>
  )
}

Departments.propTypes = {
  departments: PropTypes.array.isRequired,
  departmentId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired
}

export default Departments
