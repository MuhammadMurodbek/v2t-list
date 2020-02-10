/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiTextArea,
  EuiSpacer,
  EuiFieldText
} from '@elastic/eui'
import swal from 'sweetalert'
import Mic from '../Mic'
import api from '../../api'
import GuidedTemplates from '../../components/live/GuidedTemplates'
import steps from '../../models/live/steps'
import validatePersonnummer from '../../models/live/validatePersonnummer'
import '../../styles/guided.css'

const Step = ({ stepsHierarchy, updatedStepsHierarchy }) => {
  const predefinedSteps = steps()
  const [currentItem, setCurrentItem] = useState('')
  const [currentStep, setCurrentStep] = useState(predefinedSteps[0])
  const onChange = e => setCurrentItem(e.target.value)
  const [doktorsNamn, setDoktorsNamn] = useState('')
  const [personnummer, setPersonnummer] = useState('')
  const [patientsNamn, setPatientsNamn] = useState('')
  const [template, setTemplate] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState({templates: []})
  const [sectionHeaders, setSectionHeaders] = useState([])
  const [listOfTemplates, setListOfTemplates] = useState([])
  
  const goPrevious = () => {
    predefinedSteps.forEach((step, i)=>{
      if (
        currentStep === step 
        && currentStep !== predefinedSteps[0]
      ) {
        setCurrentStep(predefinedSteps[i-1])
        changeHierarchyBack(i - 1)
        if (i === 1) {
          setPatientsNamn(currentItem)
          setCurrentItem(doktorsNamn)
        }
        else if (i === 2) {
          setPersonnummer(currentItem)
          setCurrentItem(patientsNamn)
        }
        else if (i === 3) {
          setTemplate(currentItem)
          setCurrentItem(personnummer)
        }
        else if (i === 4) {
          // Should be dictation
          setCurrentItem(template)
        }
        
      }
    })
  }
  
  const changeHierarchyBack = (index) => {
    const newStepsHierarchy = stepsHierarchy.map((step, i) => {
      let tempObject
      if (i === index) {
        tempObject = {
          status: 'primary',
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i < index) {
        
        return step
      } else {
        tempObject = {
          status: 'disabled',
          // isSelected: false,
          // isComplete: false
        }
        return { ...step, ...tempObject }
      }
    })
    updatedStepsHierarchy(newStepsHierarchy)
  }
  
  const goNext = async () => {
    const templatesFromServer = await api.getSectionTemplates()
    console.log(templatesFromServer)
    setTemplates(templatesFromServer.data)
    setListOfTemplates(templatesFromServer.data.templates)
    

    predefinedSteps.forEach((step, i) => {
      if (
        currentStep === step 
        && currentStep !== predefinedSteps[predefinedSteps.length - 1] 
        && currentItem.length>0
      ) {   
        setCurrentStep(predefinedSteps[i +1])
        // changeHierarchyNext(i + 1, currentItem)
        
        if (i === 0) {
          changeHierarchyNext(i + 1, currentItem)
          setDoktorsNamn(currentItem)
          if(patientsNamn.length===0) setCurrentItem('')
          else setCurrentItem(patientsNamn)
        } else if (i === 1 ) {
          changeHierarchyNext(i + 1, currentItem)
          setPatientsNamn(currentItem)
          if (personnummer.length === 0) setCurrentItem('')
          else {
            setCurrentItem(personnummer)
          }
        } else if (i === 2 ) {
          const personnummerValidation = validatePersonnummer(currentItem)
          console.log('Beginning personnummer validation')
          if (personnummerValidation.status) {
            setPersonnummer(personnummerValidation.message)
            changeHierarchyNext(i + 1, personnummerValidation.message)
            if (template.length === 0) {
              setCurrentItem('')
            }
            else setCurrentItem(template)
          } else {
            changeHierarchyNext(i , '')
            swal(personnummerValidation.message)
            swal({
              title: personnummerValidation.message,
              text: '',
              icon: 'info',
              button: 'Ok'
            })
            setCurrentItem('')
            setCurrentStep('patients Personnummer')
            
          }
        } else if (i === 3 ) {
          setTemplate(currentItem)
        }
      }
    })
  }

  const updatedSections = (sections) => {
    console.log(sections)
  }

  const changeHierarchyNext = (index, itemName) => {
    const newStepsHierarchy = stepsHierarchy.map((step, i) => {
      let tempObject
      if (i === index) {
        tempObject = {
          status: 'primary',
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i > index) {
        tempObject = {
          disabled: true
        }
        return { ...step, ...tempObject }
      } else {
        tempObject = {
          status: 'complete'
        }
        return { ...step, ...tempObject }
      }
    })

    const å = newStepsHierarchy.map((s, j) => { 
      if(j===index-1) {
        const tempObject = {
          children: `${itemName}`
        }
        return { ...s, ...tempObject }
      } 
      else return s
    })
    updatedStepsHierarchy(å)
  }

  const microphoneBeingPressed = false
  const recordingAction = 'starta'
  const toggleRecord = () => true
  const updateSectionHeader = (sectionHeaders) => {
    setSectionHeaders(sectionHeaders)
  }
  const updateTemplateId = (templateId) => {
    setTemplateId(templateId)
  }
  const usedSections = []
  return (
    <Fragment>
      <Mic
        recordingAction={recordingAction}
        microphoneBeingPressed={microphoneBeingPressed}
        toggleRecord={toggleRecord}
      />
      <EuiSpacer size="l" />
      <EuiFlexGroup >
        <EuiFlexItem style={{ paddingTop: 100, maxWidth: 300}}>
          <EuiButtonIcon
            color={currentStep !== predefinedSteps[0] ? 'primary' : 'disabled'}
            iconSize="xxl"
            onClick={() => goPrevious()}
            iconType="arrowLeft"
            aria-label="Next"
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <span style={{
            'display': currentStep === 'doctors namn'
              || currentStep === 'patients name'?'flex':'none'}}>
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
          </span>
          <span style={{
            'display': currentStep === 'patients Personnummer'?'block':'none'
          }}>
            <span>
              <EuiSpacer size="xxl" />
              <EuiSpacer size="xxl" />
              <EuiSpacer size="m" />
              <EuiFieldText
                placeholder={// eslint-disable-next-line max-len
                  `Säg/Skriv ${currentStep}\nSäg Nästa" eller "Tillbaka" efter namnet`
                }
                value={currentItem}
                onChange={onChange}
                aria-label="Use aria labels when no actual label is in use"
                fullWidth = {true}
                className="guidedBoxPersonnummer"
              />
            </span>
          </span>
          <span style={{
            'display': currentStep === 'template' ? 'block' : 'none'
          }}>
            <EuiSpacer size="xxl" />
            <GuidedTemplates
              listOfTemplates={listOfTemplates}
            />
          </span>
        </EuiFlexItem>
        <EuiFlexItem style={{ paddingTop: 100, maxWidth: 300 }}>
          <EuiButtonIcon
            onClick={() => goNext()}
            iconSize="xxl"
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
