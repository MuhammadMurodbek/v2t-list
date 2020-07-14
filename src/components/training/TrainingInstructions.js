// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiBasicTable, EuiSpacer } from '@patronum/eui'
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
      shortcut: 'alt + p'
    },
    {
      action: 'Pausa',
      shortcut: 'alt + p'
    },
    {
      action: 'Uppspelningshastighet (snabbare)',
      shortcut: 'alt + k'
    },
    {
      action: 'Uppspelningshastighet (långsammare)',
      shortcut: 'alt + m'
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
