// Used react synthetic event
import React, { useState, Fragment } from 'react'
import {
  EuiSpacer, EuiTabbedContent, EuiFlexGroup, EuiFlexItem
} from '@elastic/eui'
import TrainingInstructions from './TrainingInstructions'
import TrainingButtonActions from './TrainingButtonActions'
import TrainingHelpText from './TrainingHelpText'
import '../../App.css'

const TrainingHelp = () => {
  const tabsInit = [
    {
      id: 'controlreference',
      name: 'Snabb Kommandon',
      content: (
        <Fragment>
          <EuiSpacer size="l" />
          <EuiFlexGroup>
            <EuiFlexItem>
              <TrainingInstructions />
            </EuiFlexItem>
            <EuiFlexItem>
              <TrainingButtonActions />
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      )
    }, {
      id: 'instructions',
      name: 'Användarguide',
      content: (
        <Fragment>
          <EuiSpacer size="l" />
          <TrainingHelpText />
        </Fragment>
      )
    }
  ]

  const [tabs] = useState(tabsInit)
  return (
    <Fragment>
      <EuiTabbedContent
        tabs={tabs}
        initialSelectedTab={tabs[0]}
        autoFocus="selected"
      />
    </Fragment>
  )
}

export default TrainingHelp
