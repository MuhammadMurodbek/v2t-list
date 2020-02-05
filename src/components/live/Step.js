/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiTextArea,
  EuiSpacer
} from '@elastic/eui'
import Mic from '../Mic'
import steps from '../../models/live/steps'
import '../../styles/guided.css'

const Step = ({ stepsHierarchy, updatedStepsHierarchy }) => {
  const predefinedSteps = steps()
  const [currentItem, setCurrentItem] = useState('')
  const [currentStep, setCurrentStep] = useState(predefinedSteps[0])
  const onChange = e => setCurrentItem(e.target.value)
  const [doktorsNamn, setDoktorsNamn] = useState('')
  const [personummer, setPersonnummer] = useState('')
  const [patientsNamn, setPatientsNamn] = useState('')
  const [template, setTemplate] = useState('')
  
  const goPrevious = () => {
    predefinedSteps.forEach((step, i)=>{
      if (
        currentStep === step 
        && currentStep !== predefinedSteps[0]
      ) {
        setCurrentStep(predefinedSteps[i-1])
        changeHierarchyBack(i - 1)
        if (i === 1) {
          setCurrentItem(doktorsNamn)
          // if (doktorsNamn.length === 0) setCurrentItem('')
        }
        else if (i === 2) {setCurrentItem(patientsNamn)}
        else if (i === 3) {setCurrentItem(personummer)}
        else if (i === 4) {setCurrentItem(template)}
        
      }
    })
  }
  
  const changeHierarchyBack = (index) => {
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
    updatedStepsHierarchy(newStepsHierarchy)
  }

  const goNext = () => {
    predefinedSteps.forEach((step, i) => {
      if (
        currentStep === step 
        && currentStep !== predefinedSteps[predefinedSteps.length - 1] 
        && currentItem.length>0
      ) {
        setCurrentStep(predefinedSteps[i +1])
        changeHierarchyNext(i+1)
        if (i === 0) {
          setDoktorsNamn(currentItem)
          if(patientsNamn.length===0) setCurrentItem('')
          else setCurrentItem(patientsNamn)
        } else if (i === 1 ) {
          setPatientsNamn(currentItem)
          if (personummer.length === 0) setCurrentItem('')
          else setCurrentItem(personummer)
        } else if (i === 2 ) {
          setPersonnummer(currentItem)
          if (template.length === 0) setCurrentItem('')
          else setCurrentItem(template)
        } else if (i === 3 ) {
          setTemplate(currentItem)
        }
        
        
      }
    })
  }

  const changeHierarchyNext = (index) => {
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
    updatedStepsHierarchy(newStepsHierarchy)
  }

  // const [microphoneBeingPressed, setMicrophoneBeingPressed] = useState(false)
  // const [recordingAction, setRecordingAction] = useState('starta')
  const microphoneBeingPressed = false
  const recordingAction = 'starta'
  const toggleRecord = () => true

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
            color={currentStep !== predefinedSteps[0] ? 'primary' : 'disabled'}
            onClick={() => goPrevious()}
            iconType="arrowLeft"
            aria-label="Next"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTextArea
            placeholder={
              // eslint-disable-next-line max-len
              `Säg/Skriv ${currentStep}\nSäg Nästa" eller "Tillbaka" efter namnet`
            }
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
              currentStep !== predefinedSteps[predefinedSteps.length - 1]
              && currentItem.length > 0 ? 'primary' : 'disabled' 
            }
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
}
export default Step
