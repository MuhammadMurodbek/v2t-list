/* eslint-disable no-console */
/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect, Fragment } from 'react'
import swal from 'sweetalert'
import steps from '../../models/live/steps'
import validatePersonnummer from '../../models/live/validatePersonnummer'
import '../../styles/guided.css'

const Step = ({
  stepsHierarchy,
  updatedStepsHierarchy,
  prevContent,
  currentContent
}) => {
  const predefinedSteps = steps()
  const [currentItem, setCurrentItem] = useState('')
  const [currentStep, setCurrentStep] = useState(predefinedSteps[0])
  const [doktorsNamn, setDoktorsNamn] = useState('')
  const [personnummer, setPersonnummer] = useState('')
  const [patientsNamn, setPatientsNamn] = useState('')
  const [template, setTemplate] = useState('')
  const [templates, setTemplates] = useState({ templates: [] })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [listOfTemplates, setListOfTemplates] = useState([])
  const [editorBeingUsed, setEditorBeingUsed] = useState(false)
  const [usedContents, setUsedContents] = useState([])
  // const [previousContent, setPreviousContent] = useState('')

  useEffect(() => {
    // console.log('changing')
    // console.log(content)
    updateStepBar(usedContents)
    console.log('----------------------')
    console.log(prevContent)
    console.log(currentContent)
    console.log('usedContents')
    console.log(usedContents)
    console.log('----------------------')
    if (
      currentContent.trim().toLowerCase() ===
        prevContent.trim().toLowerCase() &&
      currentContent.trim().toLowerCase() !== '' &&
      prevContent.trim().toLowerCase() !== '' &&
      usedContents.includes(currentContent) === false
    ) {
      console.log('....')
      // consoxle.log(prevContent)
      console.log('....')

      if (!usedContents.includes(prevContent)) {
        // setCurrentItem(prevContent)
        // goNext(true)
        updateStepBar(usedContents)
        setUsedContents([...usedContents, prevContent])
      }
    }
  })

  const updateStepBar = (contents) => {
    const contentLenght = contents.length
    const newStepsHierarchy = stepsHierarchy.map((step, i) => {
      let tempObject
      if (i === contentLenght - 1) {
        tempObject = {
          status: 'primary',
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i > contentLenght - 1) {
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

    const finalSteps = newStepsHierarchy.map((s, j) => {
      const tempObject = {
        children: contents[j]
      }
      return { ...s, ...tempObject }
    })
    updatedStepsHierarchy(finalSteps)
  }

  /**
   * @param {{ target: { value: React.SetStateAction<string>; }; }} e
   */
  const onChange = (e) => {
    setEditorBeingUsed(true)
    setCurrentItem(e.target.value)
  }

  const goPrevious = () => {
    predefinedSteps.forEach((step, i) => {
      if (currentStep === step && currentStep !== predefinedSteps[0]) {
        setCurrentStep(predefinedSteps[i - 1])
        changeHierarchyBack(i - 1)
        if (i === 1) {
          setPatientsNamn(currentItem)
          setCurrentItem(doktorsNamn)
        } else if (i === 2) {
          setPersonnummer(currentItem)
          setCurrentItem(patientsNamn)
        } else if (i === 3) {
          setTemplate(currentItem)
          setCurrentItem(personnummer)
        } else if (i === 4) {
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
          status: 'disabled'
        }
        return { ...step, ...tempObject }
      }
    })
    updatedStepsHierarchy(newStepsHierarchy)
  }

  const goNext = async (isPrefilled = false) => {
    predefinedSteps.forEach((step, i) => {
      if (
        currentStep === step &&
        currentStep !== predefinedSteps[predefinedSteps.length - 1] &&
        currentItem.length > 0
      ) {
        if (i === 0) {
          changeHierarchyNext(i + 1, currentItem)
          if (isPrefilled) setDoktorsNamn(currentItem)
          if (patientsNamn.length === 0) setCurrentItem('')
          else setCurrentItem(patientsNamn)
          setCurrentStep(predefinedSteps[i + 1])
        } else if (i === 1) {
          changeHierarchyNext(i + 1, currentItem)
          if (isPrefilled) setPatientsNamn(currentItem)
          if (personnummer.length === 0) setCurrentItem('')
          else {
            setCurrentItem(personnummer)
          }
          setCurrentStep(predefinedSteps[i + 1])
        } else if (i === 2) {
          const personnummerValidation = validatePersonnummer(currentItem)
          if (personnummerValidation.status) {
            setPersonnummer(personnummerValidation.message)
            changeHierarchyNext(i + 1, personnummerValidation.message)
            if (selectedTemplate === '') {
              setSelectedTemplate(templates.templates[0])
              setCurrentItem(templates.templates[0].name)
            }
            setCurrentStep(predefinedSteps[i + 1])
          } else {
            changeHierarchyNext(i, '')
            swal(personnummerValidation.message)
            swal({
              title: personnummerValidation.message,
              text: '',
              icon: 'info',
              buttons: [false, 'Ok']
            })
            setCurrentItem('')
            setCurrentStep('patients Personnummer')
          }
        } else if (i === 3) {
          changeHierarchyNext(i + 1, currentItem)
        }
      }
    })
  }

  const updatedTemplateIndex = (updtedIndex) => {
    setSelectedTemplate(templates.templates[updtedIndex])
    setCurrentItem(templates.templates[updtedIndex].name)
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

    const finalSteps = newStepsHierarchy.map((s, j) => {
      if (j === index - 1) {
        const tempObject = {
          children: `${itemName}`
        }
        return { ...s, ...tempObject }
      } else return s
    })
    updatedStepsHierarchy(finalSteps)
  }

  return (
    <Fragment>
      {/* <EuiSpacer size="l" />
      <EuiFlexGroup >
        <EuiFlexItem style={{ paddingTop: 100, maxWidth: 250}}>
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
              // placeholder={content}
              aria-label="Skriv Doktors Namn"
              fullWidth={true}
              // value={currentItem}  
              value={currentItem}  
              onChange={onChange}
              className= "guidedBox"
              style={{'resize': 'none'}}
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
              updatedTemplateIndex={updatedTemplateIndex}
            />
          </span>
          <span style={{
            'display': currentStep === 'dictation' ? 'block' : 'none'
          }}>
            <EuiSpacer size="xxl" />
          </span>
        </EuiFlexItem>
        <EuiFlexItem style={{ paddingTop: 100, maxWidth: 250 }}>
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
      </EuiFlexGroup> */}
    </Fragment>
  )
}

export default Step
