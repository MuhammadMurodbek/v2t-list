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
      action: 'Spela Upp',
      shortcut: 'alt + space'
    },
    {
      action: 'Pausa',
      shortcut: 'alt + space'
    },
    {
      action: 'Stega framåt',
      shortcut: 'alt + →'
    },
    {
      action: 'Stega bakåt',
      shortcut: 'alt + ←'
    },
    {
      action: 'Uppspelningshastighet (snabbare)',
      shortcut: 'shift + ↑'
    },
    {
      action: 'Uppspelningshastighet (långsammare)',
      shortcut: 'shift + ↓'
    },
    {
      action: 'Höj volymen',
      shortcut: 'alt + ↑'
    },
    {
      action: 'Sänk volymen',
      shortcut: 'alt + ↓'
    }
  ]

  return (
    <Fragment>
      Snabb kommandon
      <EuiSpacer size="s" />
      <EuiBasicTable
        items={items}
        columns={columns}
      />
    </Fragment>
  )
}

export default TrainingInstructions
