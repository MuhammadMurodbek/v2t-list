// Used react synthetic event
import React, { useState, Fragment } from 'react'
import {
    EuiBasicTable, EuiSpacer, EuiTabbedContent, EuiTitle, EuiText, EuiFlexGroup, EuiFlexItem, EuiListGroup,
    EuiListGroupItem} from '@elastic/eui'
import TrainingInstructions from './TrainingInstructions'
import TrainingButtonActions from './TrainingButtonActions'
import TrainingHelpText from './TrainingHelpText'
import '../../App.css'

const TrainingHelp = () => {
  const tabsInit = [
    {
      id: 'controlreference',
      name: 'Control Reference',
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
      name: 'How to Guide',
      content: (
        <Fragment>
          <EuiSpacer size="l" />
          <TrainingHelpText />
        </Fragment>
      )
    }
  ]

  const [tabs, setTabs] = useState(tabsInit)
  return (
    <Fragment>
      <EuiTabbedContent
        tabs={tabs}
        initialSelectedTab={tabs[0]}
        autoFocus="selected"
        onTabClick={(tab) => {
          console.log('clicked tab', tab)
        }}
      />
    </Fragment>
  )
}

export default TrainingHelp
