import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { EuiText, EuiComboBox } from '@elastic/eui'

const NumberOfSpeakers = ({ updateNumberOfSpeakers }) => {
  const options = [
    {
      label: '1'
    },
    {
      label: '2'
    },
    {
      label: '3'
    },
    {
      label: '4'
    }
  ]
  const [selectedOption, setSelectedOption] = useState([options[1]])
  const onChange = (e) => {
    setSelectedOption(e)
    updateNumberOfSpeakers(parseInt(e[0].label, 10))
  }

  return (
    <>
      <EuiText style={{ marginLeft: 16 }}>
        <h5>Number of Speakers &nbsp;&nbsp;</h5>
      </EuiText>
      <EuiComboBox
        sortMatchesBy="startsWith"
        placeholder="Select number of speakers"
        options={options}
        selectedOptions={selectedOption}
        onChange={onChange}
        singleSelection
        isClearable={false}
        style={{ width: '100px' }}
      />
    </>
  )
}

NumberOfSpeakers.propTypes = {
  updateNumberOfSpeakers: PropTypes.func.isRequired
}
export default NumberOfSpeakers
