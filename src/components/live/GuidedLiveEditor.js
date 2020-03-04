// @ts-nocheck
/* eslint-disable no-console */
import React, { useState, useEffect, Fragment } from 'react'
import {
  EuiFlexGroup, EuiFlexItem,
  EuiSteps, EuiButtonEmpty,
  EuiSpacer, EuiButton
} from '@elastic/eui'
import Dots from './Dots'
import Tags from '../Tags'
import LiveEditor from '../LiveEditor'
// import LiveTemplateEngine from '../LiveTemplateEngine'
import GuidedLiveTemplate from './GuidedLiveTemplate'
import '../../styles/guided.css'
import processChapters from '../../models/processChapters'
import TemplateMenu from './TemplateMenu'
import PersonalInfoLive from './PersonalInfoLive'
import api from '../../api'

const GuidedLiveEditor = ({
  prevContent,
  currentContent,
  listOfTemplates,
  templatesForMenu
}) => {
  const [editorVisible, setEditorVisible] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tags, setTags] = useState([])
  const [chapters, setChapters] = useState([{
    keyword: 'KONTAKTORSAK',
    segments: [{ words: '...', startTime: 0.00, endTime: 0.00 }]
  }])
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
      title: 'Journalmall',
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

  const [doktor, setDoktor] = useState('')
  const [patient, setPatient] = useState('')
  const [template, setTemplate] = useState('ext1')
  const [personnummer, setPersonnummer] = useState('')

  useEffect(() => {
    // showAnimationForDoctor()
    console.log('prevContent')
    console.log(prevContent)
    console.log('current')
    console.log(currentContent)
    if (prevContent !== '' && currentContent !== '') {
      if (prevContent.toLowerCase().trim() === currentContent.toLowerCase().trim()) {
        if (currentStepIndex < 4) {
          updateVerticalSteps(currentContent, currentStepIndex)
          setCurrentStepIndex(currentStepIndex + 1)
        }
        if (currentStepIndex === 3) {
          setEditorVisible(true)
        }
        if (currentStepIndex > 3) {
          setChapters(processChapters(currentContent, sections))
          checkForCodes(chapters)
        }
      }
    }
  }, [currentContent, prevContent])

  const checkForCodes = async () => {
    const listOfKeywords = chapters.map(chapter => chapter.keyword.trim().toLowerCase())
    if(!listOfKeywords.includes('diagnos')) {
      return
    } else {
      let textData = ''
      chapters.map(chapter => {
        if (chapter.keyword.trim().toLowerCase() === 'diagnos') {
          return chapter.segments[0].words
        } else return '' 
      }).forEach(text => {if (text) textData = textData + text })
      const result = await api.keywordsSearch(textData)
      if (result.data) 
        setTags([{ id: result.data[0].value, description: result.data[0].description}])
    }
  }

  const onUpdateTags = (tags) => {
    setTags(tags)
  }

  const updateVerticalSteps = (content, index) => {
    const newStepsHierarchy = verticalSteps.map((step, i) => {
      let tempObject
      if (i === index) {
        tempObject = {
          status: 'complete',
          disabled: false
        }
        return { ...step, ...tempObject }
      } else if (i === index + 1) {
        if (index < 3) {
          console.log('templatesForMenu')
          console.log(templatesForMenu)
          console.log('templatesForMenu end')
          if(index===2){
            tempObject = {
              status: 'primary',
              children: <Fragment><Dots /><EuiSpacer size='m' /><TemplateMenu templatesForMenu={templatesForMenu} /></Fragment >
            }
          } else {
            tempObject = {
              status: 'primary',
              children: <Dots />
            }
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
        if(index===0) {
          setDoktor(content)
        }
        if(index===1) {
          setPatient(content)
        }
        if(index===2) {
          setPersonnummer(content)
        }
        if(index===3) {
          setTemplate(content)
        }
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
        <EuiFlexItem style={{ maxWidth: 290, display: editorVisible ? 'none' : 'false' , marginTop: -150}}>
          <EuiSteps steps={verticalSteps} />
        </EuiFlexItem>
        <EuiFlexItem style={{ display: editorVisible ? 'block' : 'none', marginTop: '-200px' }}>
          <PersonalInfoLive info={{
            doktor,
            patient,
            personnummer,
            template 
          }}/>
          
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

          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty color="#000000" onClick={() => { }}>
                Avbryt
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                color="subdued"
                style={{
                  border: 'solid 1px black',
                  borderRadius: '25px'
                }}
                onClick={() => { }}>
                Spara ändringar
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                style={{
                  background: 'rgb(112, 221, 127)',
                  borderRadius: '25px',
                  color: 'black'
                }}
                onClick={sendAsHorrribleTranscription}>
                “Skicka för granskning”
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                style={{
                  background: 'rgb(9, 99, 255)',
                  color: 'white',
                  borderRadius: '25px'
                }}
                onClick={() => { }}>
                Skicka till Webdoc
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem
          style={{
            maxWidth: '400px',
            display: editorVisible ? 'block' : 'none',
            marginTop: '-200px' 
          }}
        >
          <Tags
            tags={tags}
            updateTags={onUpdateTags}
          />
          <GuidedLiveTemplate
            listOfTemplates={listOfTemplates}
            usedSections={chapters.map(chapter => chapter.keyword)}
            updatedSections={updatedSections}
            templateFromVoice={template}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )

}

export default GuidedLiveEditor
