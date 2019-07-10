// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiBasicTable, EuiSpacer } from '@elastic/eui'
import '../../App.css'

const TrainingInstructions = () => {
  const columns = [
    {
      field: 'action',
      name: 'Action',
      width: '200px'
    },
    {
      field: 'shortcut',
      name: 'Shortcut'
    }
  ]

  const items = [
    {
      action: 'Play',
      shortcut: 'alt + space'
    },
    {
      action: 'Pause',
      shortcut: 'alt + space'
    },
    {
      action: 'Forward',
      shortcut: 'alt + →'
    },
    {
      action: 'Backward',
      shortcut: 'alt + ←'
    },
    {
      action: 'Navigate Forward',
      shortcut: 'tabs'
    },
    {
      action: 'Navigate Backward',
      shortcut: 'shift + tabs'
    }
  ]

  return (
    <Fragment>
      Player Shortcuts
      <EuiSpacer size="s" />
      <EuiBasicTable
        items={items}
        columns={columns}
      />
    </Fragment>
  )
}

export default TrainingInstructions
