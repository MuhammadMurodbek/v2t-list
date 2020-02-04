/* eslint-disable no-console */
import React, { Component } from 'react'
import {
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStepsHorizontal
} from '@elastic/eui'
import Page from '../components/Page'
import Doctor from '../components/live/Doctor'

export default class GuidedLive extends Component {
  state = {
    isDoctorVisible: true,
    horizontalSteps: [
      {
        title: 'Doktors Namn',
        isComplete: false,
        disabled: false,
        isSelected: true,
        onClick: () => this.askDoctorsName()
      }, {
        title: 'Patients Namn',
        isComplete: false,
        disabled: false,
        isSelected: false,
        onClick: () => this.askPatientsName()
      }, {
        title: 'Patients Personnummer',
        disabled: true,
        onClick: () => this.askPersonnummer()
      }, {
        title: 'Template',
        disabled: true,
        onClick: () => this.askTemplate()
      }, {
        title: 'Diktering',
        disabled: true,
        onClick: () => this.börjaDiktering()
      }]
  }

  componentDidMount = () => {
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }
  
  askDoctorsName = () => {
    const { horizontalSteps } = this.state
    this.setState({ isDoctorVisible: true })
    // horizontalSteps[0].disabled = false,
    console.log('in the doctors name')
    this.disableOtherThan(horizontalSteps, 0)
  }

  askPatientsName = () => {
    const { horizontalSteps } = this.state
    this.setState({ isDoctorVisible: false },()=>{
      this.disableOtherThan(horizontalSteps, 1)
    })
  }
  
  askPersonnummer = () => {
    const { horizontalSteps } = this.state
    this.setState({ isDoctorVisible: false }, () => {
      this.disableOtherThan(horizontalSteps, 2)
    })
  }

  askTemplate = () => {
    const { horizontalSteps } = this.state
    this.setState({ isDoctorVisible: false }, () => {
      this.disableOtherThan(horizontalSteps, 3)
    })
  }

  börjaDiktering = () => {
    const { horizontalSteps } = this.state
    this.setState({ isDoctorVisible: false }, () => {
      this.disableOtherThan(horizontalSteps, 4)
    })
  }

  updateSteps = (steps) => {
    this.setState({ horizontalSteps: steps },
      ()=>{
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
    console.log('p')
    this.setState({ horizontalSteps: updatedSteps })
  }


  render() {
    const { horizontalSteps, isDoctorVisible } = this.state
    return (
      <Page preferences title = "" logo="">
        <EuiFlexGroup >
          <EuiFlexItem>
            <EuiStepsHorizontal steps={horizontalSteps} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiSpacer size="l" />
        <EuiSpacer size="l" />
        <EuiSpacer size="l" />
        <EuiFlexGroup>
          <EuiFlexItem style={{ display: isDoctorVisible ? 'flex' : 'none' }}>
            <Doctor stepsHierarchy={horizontalSteps} updatedStepsHierarchy={this.updateSteps}/>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
    )
  }
}


