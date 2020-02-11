// @ts-nocheck
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
    verticalSteps: [
      {
        title: 'Doktors Namn',
        children: <p></p>,
        disabled: false,
        onClick: () => {}
      }, {
        title: 'Patients Namn',
        children: <p></p>,
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
    this.setState({ verticalSteps: steps })
  }

  disableOtherThan = (verticalSteps, index) => {
    const updatedSteps = verticalSteps.map((step, i)=>{
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
    this.setState({ verticalSteps: updatedSteps })
  }

  render() {
    const { verticalSteps } = this.state
    return (
      <Page preferences title = "" logo="">
        <EuiFlexGroup >
          <EuiFlexItem style={{ maxWidth: 290 }}>
            <EuiSteps steps={verticalSteps} />
          </EuiFlexItem>
          <EuiFlexItem>
            <Step
              stepsHierarchy={verticalSteps}
              updatedStepsHierarchy={this.updateSteps}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}
