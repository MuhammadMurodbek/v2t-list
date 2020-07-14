import React, { Fragment, useState, useEffect } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTextArea,
  EuiFormRow,
  EuiI18n
} from '@patronum/eui'

const SideNote = ({ value }) => {
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
          <EuiFormRow
            label={<EuiI18n token="compareNotes" default="Compare Notes" />}
          >
            <EuiI18n
              token="writeANoteToCoWorker"
              default="Write a note to Co-worker"
            >
              {(translation) => (
                <EuiTextArea
                  placeholder={translation}
                  value={note}
                  onChange={onChange}
                  style={{ resize: 'none' }}
                />
              )}
            </EuiI18n>
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}

export default SideNote
