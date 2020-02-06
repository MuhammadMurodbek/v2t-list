/* eslint-disable no-console */
import React, { Component } from 'react'
import {
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStepsHorizontal
} from '@elastic/eui'
import Page from '../components/Page'
import Step from '../components/live/Step'

export default class GuidedLive extends Component {
  state = {
    currentStepIndex: 0,
    horizontalSteps: [
      {
        title: 'Doktors Namn',
        isComplete: false,
        disabled: false,
        isSelected: true,
        status: 'incomplete',
        onClick: () => {}
      }, {
        title: 'Patients Namn',
        isComplete: false,
        disabled: true,
        isSelected: false,
        status: 'incomplete',
        onClick: () => { }
      }, {
        title: 'Patients Personnummer',
        disabled: true,
        status: 'incomplete',
        onClick: () => { }
      }, {
        title: 'Template',
        disabled: true,
        status: 'incomplete',
        onClick: () => { }
      }, {
        title: 'Diktering',
        disabled: true,
        status: 'incomplete',
        onClick: () => { }
      }]
  }

  componentDidMount = () => {
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }

  updateSteps = (steps) => {
    this.setState({ horizontalSteps: steps },
      ()=>{
        steps.forEach((step, i)=>{
          console.log(step.isSelected)
          if (step.isSelected) {
            this.setState({ currentStepIndex: i})
          }
        })
        console.log('updated steps')
        console.log(steps)
        console.log('updated steps end')
      })
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
    const { horizontalSteps, params } = this.state
    return (
      <Page preferences title = "" logo="">
        <EuiFlexGroup >
          <EuiFlexItem>
            <EuiStepsHorizontal steps={horizontalSteps} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        <EuiFlexGroup>
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
