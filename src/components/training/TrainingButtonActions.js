// Used react synthetic event
import React, { Fragment } from 'react'
import { EuiBasicTable, EuiSpacer } from '@elastic/eui'
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
      button: 'Godkänn',
      usage: 'Slutför transkriberingen.'
    },
    {
      button: 'Hoppa över',
      usage: 'Hoppa över transkriptet. Om Du hoppar över transkriptet så kan det komma upp vid ett senare tillfälle.'
    },
    {
      button: 'Reject',
      usage: 'Markera transkriptet som felaktigt.'
    },
    {
      button: '⚙️',
      usage: 'Avancerad konfiguration.'
    }
  ]

  return (
    <Fragment>
        Knapp referens
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
