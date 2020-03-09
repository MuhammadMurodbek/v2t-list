import React, {Fragment, useState, useEffect} from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiTextArea, EuiText, EuiFormRow
} from '@elastic/eui'

const SideNote = ({value}) => {
  const [note, setNote] = useState('')   
  useEffect(() => {
    setNote(value)
  }, [note])
  
  const onChange = (e) => {
    setNote(e.target.value)    
  }
  return (
    <Fragment>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Antecknigar">
          <EuiTextArea
            placeholder="Skriv en anteckning till Co-worker"
            aria-label="Skriv en anteckning till Co-worker"
            value={note}
            onChange={onChange}
            style={{resize: 'none'}}
          />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default SideNote