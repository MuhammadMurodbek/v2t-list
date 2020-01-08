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
      action: 'Uppspelningshastighet (snabbare)',
      shortcut: 'shift + k'
    },
    {
      action: 'Uppspelningshastighet (långsammare)',
      shortcut: 'shift + m'
    },
    {
      action: 'Höj volymen',
      shortcut: 'alt + j'
    },
    {
      action: 'Sänk volymen',
      shortcut: 'alt + n'
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
