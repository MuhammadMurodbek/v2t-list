/* eslint-disable no-console */
import React, { Component } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSteps
} from '@elastic/eui'
import Page from '../components/Page'
import Step from '../components/live/Step'

export default class GuidedLive extends Component {
  state = {
    currentStepIndex: 0,
    horizontalSteps: [
      {
        title: 'Doktors Namn',
        children: <p></p>,
        // isComplete: false,
        disabled: false,
        
        // status: 'primary',
        onClick: () => {}
      }, {
        title: 'Patients Namn',
        children: <p></p>,
        // isComplete: false,
        disabled: true,
        status: 'disabled',
        onClick: () => { }
      }, {
        title: 'Patients Personnummer',
        children: <p></p>,
        disabled: true,
        status: 'disabled',
        onClick: () => { }
      }, {
        title: 'Template',
        children: <p></p>,
        disabled: true,
        status: 'disabled',
        onClick: () => { }
      }, {
        title: 'Diktering',
        children: <p></p>,
        disabled: true,
        status: 'disabled',
        onClick: () => { }
      }]
  }

  componentDidMount = () => {
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }

  updateSteps = (steps) => {
    this.setState({ horizontalSteps: steps })
  }

  disableOtherThan = (horizontalSteps, index) => {
    const updatedSteps = horizontalSteps.map((step, i)=>{
      let tempObject
      if (i === index) {
        tempObject = {
          isSelected: true    
        } 
        return { ...step, ...tempObject } 
      } else {
        tempObject = {
          isSelected: false
        } 
        return { ...step, ...tempObject } 
      }
    })
    this.setState({ horizontalSteps: updatedSteps })
  }

  render() {
    const { horizontalSteps } = this.state
    return (
      <Page preferences title = "" logo="">
        <EuiFlexGroup >
          <EuiFlexItem style={{ maxWidth: 290 }}>
            {/* <EuiStepsHorizontal steps={horizontalSteps} /> */}
            <EuiSteps steps={horizontalSteps} />
          </EuiFlexItem>
        {/* </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup> */}
          <EuiFlexItem>
            <Step
              stepsHierarchy={horizontalSteps}
              updatedStepsHierarchy={this.updateSteps}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}
