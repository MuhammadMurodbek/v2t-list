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
        onClick: () => this.shiftState(0)
      }, {
        title: 'Patients Namn',
        isComplete: false,
        disabled: false,
        isSelected: false,
        onClick: () => this.shiftState(1)
      }, {
        title: 'Patients Personnummer',
        disabled: true,
        onClick: () => this.shiftState(2)
      }, {
        title: 'Template',
        disabled: true,
        onClick: () => this.shiftState(3)
      }, {
        title: 'Diktering',
        disabled: true,
        onClick: () => this.shiftState(4)
      }]
  }

  componentDidMount = () => {
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }
  
  shiftState = (toStep) => {
    console.log(toStep)
    const { horizontalSteps, currentStepIndex } = this.state
    if (currentStepIndex !== toStep) {
      console.log(horizontalSteps)
      const newStepsHierarchy = horizontalSteps.map((step, i) => {
        if (i === toStep) {
          const tempObject = {
            isSelected: true,
            isComplete: false,
            disabled: false
          }
          return { ...step, ...tempObject }
        } else if(i === currentStepIndex) {
          const tempObject = {
            isSelected: false,
            isComplete: true,
            disabled: false
          }
          return { ...step, ...tempObject }
        } else {
          return step
        }
      
      })
      console.log(newStepsHierarchy)
      this.setState({ horizontalSteps: newStepsHierarchy})
      // tempObject = {
      //   isSelected: false,
      //   isComplete: false
      // }
      // { ...step, ...tempObject }
      
      // this.setState({
      //   horizontalSteps: 
      // })
      // horizontalSteps[currentStepIndex].isComplete = true
      // horizontalSteps[currentStepIndex].isSelected = false
    }
    // this.jumpToStep(currentStepIndex, 0)
    // this.setState({ isDoctorVisible: true })
    // this.disableOtherThan(horizontalSteps, 0)
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
    const { horizontalSteps } = this.state
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
