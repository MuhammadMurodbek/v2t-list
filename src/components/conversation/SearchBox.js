import React from 'react'
// import PropTypes from 'prop-types'
import { EuiForm, EuiFieldText } from '@elastic/eui'


const SerachBox = () => {
  const divProperties = {
    position: 'absolute',
    marginLeft: -524,
    marginTop: 8,
    width: 150
  }

  return (
    <div style={divProperties}>
      <EuiForm>
        <EuiFieldText></EuiFieldText>
      </EuiForm>
    </div>
  )
}

export default SerachBox
