// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiBasicTable, EuiSpacer, EuiIcon } from '@elastic/eui'
import '../../App.css'

const TrainingInstructions = () => {
  const columns = [
    {
      field: 'button',
      name: 'Button',
      width: '100px'
    },
    {
      field: 'usage',
      name: 'Usage'
    }
  ]

  const items = [
    {
      button: 'Complete',
      usage: 'Complete the transcript.'
    },
    {
      button: 'Skip',
      usage: 'Skip the transcript. If you use this option, this text might come up again later.'
    },
    {
      button: 'Reject',
      usage: 'Mark this transcript as a bad one.'
    },
    {
      button: '⚙️',
      usage: 'Use this button for additional configuration.'
    }
  ]

  return (
    <Fragment>
        Button Reference
      <EuiSpacer size="s" />
      <EuiBasicTable
        items={items}
        columns={columns}
        responsive
      />
    </Fragment>
  )
}

export default TrainingInstructions
