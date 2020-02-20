// @ts-nocheck
/* eslint-disable no-console */
import React, { useState, useEffect, Fragment } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSteps,
  EuiSpacer, EuiText, EuiButton
} from '@elastic/eui'
import Dots from './Dots'
import Tags from '../Tags'
import LiveEditor from '../LiveEditor'
import LiveTemplateEngine from '../LiveTemplateEngine'
import '../../styles/guided.css'
import processChapters from '../../models/processChapters'

const GuidedLiveEditor = ({ prevContent, currentContent, listOfTemplates}) => {
  const [editorVisible, setEditorVisible] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tags, setTags] = useState([])
  const [chapters, setChapters] = useState([{
    keyword: 'KONTAKTORSAK',
    segments: [{ words: '...', startTime: 0.00, endTime: 0.00 }]
  }])
  // const [chapters, setChapters] = useState([{
  //   keyword: 'KONTAKTORSAK',
  //   segments: [{ words: '...', startTime: 0.00, endTime: 0.00 }]
  // }])
  const [sections, setSections] = useState({
    'KONTAKTORSAK': [],
    'AT': [],
    'LUNGOR': [],
    'BUK': [],
    'DIAGNOS': []
  })
  const [verticalSteps, setVerticalSteps] = useState([
    {
      title: 'Doktors Namn',
      children: <p></p >,
      disabled: false,
      onClick: () => { }
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
    }])


    const [finalText, setFinalText] = useState('')

  useEffect(()=>{
    // showAnimationForDoctor()
    console.log('prevContent')
    console.log(prevContent)
    console.log('current')
    console.log(currentContent)
    if (prevContent !== '' && currentContent!==''){
      if(prevContent.toLowerCase().trim()===currentContent.toLowerCase().trim()){
        // if(currentStepIndex===1) {
        //   templates()
        // }
        if(currentStepIndex<4) {
          updateVerticalSteps(currentContent, currentStepIndex)
          setCurrentStepIndex(currentStepIndex + 1)
        }
        if (currentStepIndex === 3) {
          console.log('hola')
          setEditorVisible(true)
        }
        if (currentStepIndex>3){
          setFinalText(`${finalText} ${currentContent}`)
          setChapters(processChapters(finalText, sections))
        }
        
      }
    }
  }, [currentContent, prevContent])


  const onUpdateTags = (tags) => {
    setTags(tags)
  }
  
  // const showAnimationForDoctor = () => {
  //   if (currentStepIndex === 0 ) {
  //     const finalSteps = verticalSteps.map((s, j) => {
  //       if (j === 0) {
  //         const tempObject = {
  //           children: <p><Dots /></p>
  //         }
  //         return { ...s, ...tempObject }
  //       } else {
  //         return { ...s }
  //       }
  //     })
  //     setVerticalSteps(finalSteps)
  //   }
  // }

  const updateVerticalSteps = (content, index) => {
    const newStepsHierarchy = verticalSteps.map((step, i) => {
      let tempObject
      if (i === index) {
        tempObject = {
          status: 'complete',
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i === index+1) {
        if (index < 3){
          tempObject = {
            status: 'primary',
            children: <Dots />
          }
          return { ...step, ...tempObject }
        } else {
          tempObject = {
            status: 'primary',
            children: <p>Starta diktering ... </p>
          }
          return { ...step, ...tempObject }
        }
        
      }
      else if (i > index) {
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
      if (j === index) {
        const tempObject = {
          children: <p>{content}</p>
        }
        return { ...s, ...tempObject }
      } else {
        return { ...s }
      }
    })
    setVerticalSteps(finalSteps)
  }

  const sendAsHorrribleTranscription = () => {

  }

  const onSelectText = () => {
    // update later
  }
  const onUpdateTranscript = () => {

  }
  const onCursorTimeChange = () => {

  }

  const updatedSections = (sections) => {
    // this.validateSections(sections)
    setSections(sections)
  }

  return (     
    <Fragment>
      <EuiFlexGroup >
        <EuiFlexItem style={{ maxWidth: 290 }}>
          <EuiSteps steps={verticalSteps} />
        </EuiFlexItem>
        <EuiFlexItem style={{display: editorVisible? 'block':'none'}}>
          <EuiText grow={false}>
            <h3>Editor</h3>
          </EuiText>
          <EuiSpacer size="m" />
          <LiveEditor
            transcript={chapters}
            originalChapters={chapters}
            chapters={chapters}
            currentTime={0.00}
            onSelect={onSelectText}
            updateTranscript={onUpdateTranscript}
            onCursorTimeChange={onCursorTimeChange}
            isDiffVisible={false}
            sectionHeaders={Object.keys(sections)}
            initialCursor={0}
          />
          
          <EuiFlexGroup >
            <EuiFlexItem grow={false}>
              <EuiButton fill color="secondary" onClick={() => { }}>
                Skicka till Co-Worker
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                color="danger"
                onClick={sendAsHorrribleTranscription}>
              “Skicka för granskning”
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="secondary" onClick={()=>{}}>
                Spara ändringar
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="danger" onClick={() => { }}>
              Avbryt
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem
          style={{ 
            maxWidth: '400px',
            display: editorVisible ? 'block' : 'none'
          }}
        >
          <Tags
            tags={tags}
            updateTags={onUpdateTags}
          />
          <EuiSpacer size="l" />
          <EuiSpacer size="l" />
          <LiveTemplateEngine
            listOfTemplates={listOfTemplates}
            usedSections={chapters.map(chapter => chapter.keyword)}
            updatedSections={updatedSections}
          /> 
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )

}

export default GuidedLiveEditor
