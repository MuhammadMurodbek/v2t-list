/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTextAlign,
  EuiButtonIcon,
  EuiTextArea,
  EuiSpacer
} from '@elastic/eui'
import Mic from '../../components/Mic'
import '../../styles/guided.css'

const Doctor = ({ stepsHierarchy, updatedStepsHierarchy }) => {
  const [currentItem, setCurrentItem] = useState('')
  const [patientsName, setPatientsName] = useState('')
  const steps = [
    'doctors namn',
    'patients name',
    'patiets Personnummer',
    'template',
    'dictation'
  ]
  const [currentStep, setCurrentStep] = useState('doctors namn')
  const onChange = (e) => {
    setCurrentItem(e.target.value)
  }

  const goPrevious = () => {
    steps.forEach((step, i)=>{
      if (
        currentStep === step 
        && currentStep!==steps[0]
      ) {
        setCurrentStep(steps[i-1])
        changeHierarchyBack(i - 1)
        setCurrentItem('')
      }
    })
  }
  
  const changeHierarchyBack = (index) => {
    console.log(' Change hierarchy ')
    console.log(index)
    console.log('current hi')
    console.table(stepsHierarchy)
    console.log('current hi')
    console.log('new hi')
    const newStepsHierarchy = stepsHierarchy.map((step, i) => {
      let tempObject
      if (i === index) {
        tempObject = {
          isSelected: true,
          isComplete: false,
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i < index) {
        tempObject = {
          isSelected: true,
          isComplete: true
        }
        return { ...step, ...tempObject }
      } else {
        tempObject = {
          isSelected: false,
          isComplete: false
        }
        return { ...step, ...tempObject }
      }
    })
    console.table(newStepsHierarchy)
    console.log('new hi end')
    // })
    // console.log('p')
    // this.setState({ horizontalSteps: updatedSteps })


    updatedStepsHierarchy(newStepsHierarchy)
    console.log(' Change hierarchy end ')
  }


  const goNext = () => {
    steps.forEach((step, i) => {
      if (
        currentStep === step 
        && currentStep !== steps[steps.length - 1] 
        && currentItem.length>0
      ) {
        setCurrentStep(steps[i +1])
        changeHierarchyNext(i+1)
        setCurrentItem('')
      }
    })
  }

  const changeHierarchyNext = (index) => {
    console.log(' Change hierarchy ')
    console.log(index)
    console.log('current hi')
    console.table(stepsHierarchy)
    console.log('current hi')
    console.log('new hi')
    const newStepsHierarchy = stepsHierarchy.map((step, i) => {
      let tempObject
      if (i === index) {
        tempObject = {
          isSelected: true,
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i > index) {
        tempObject = {
          isSelected: false,
          disabled: true
        }
        return { ...step, ...tempObject }
      } else {
        tempObject = {
          isComplete: true,
          disabled: false
        }
        return { ...step, ...tempObject }
      }
    })
    console.table(newStepsHierarchy)
    console.log('new hi end')
    // })
    // console.log('p')
    // this.setState({ horizontalSteps: updatedSteps })


    updatedStepsHierarchy(newStepsHierarchy)
    console.log(' Change hierarchy end ')
  }


  
  const moveToPersonnummer = () => {
    if (currentItem.length>0)
      console.log('moving to personnummer')
  }

  const toggleRecord = ( ) => {

  }
  const [microphoneBeingPressed, setMicrophoneBeingPressed] = useState(false)
  const [recordingAction, setRecordingAction] = useState('starta')



  return (
    <Fragment>
      <Mic
        recordingAction={recordingAction}
        microphoneBeingPressed={microphoneBeingPressed}
        toggleRecord={toggleRecord}
      />
      <EuiSpacer size="l" />
      <EuiFlexGroup >
        <EuiFlexItem style={{ paddingTop: 300}}>
          <EuiButtonIcon
            color={currentStep !== steps[0] ? 'primary' : 'disabled'}
            onClick={() => goPrevious()}
            iconType="arrowLeft"
            aria-label="Next"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTextArea
            placeholder={`Säg/Skriv ${currentStep} \nSäg "Nästa" eller "Tillbaka" efter namnet`}
            aria-label="Skriv Doktors Namn"
            resize="none"
            fullWidth={true}
            value={currentItem}
            onChange={onChange}
            className= "guidedBox"
          />
        </EuiFlexItem>
        <EuiFlexItem style={{ paddingTop: 300 }}>
          <EuiButtonIcon
            onClick={() => goNext()}
            iconType="arrowRight"
            aria-label="Next"
            color={
              currentStep !== steps[steps.length - 1] && currentItem.length > 0 ? 'primary' : 'disabled' 
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}
export default Doctor
