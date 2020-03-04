/* eslint-disable no-console */
/* eslint-disable react/prop-types */
/* eslint-disable camelcase */
/* eslint-disable no-alert */
import React, { Component } from 'react'
import {
  EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiButton, EuiHorizontalRule
} from '@elastic/eui'
import swal from 'sweetalert'
import api from '../api'
import Page from '../components/Page'
import { PreferenceContext } from '../components/PreferencesProvider'
import Editor from '../components/Editor'
import Tags from '../components/Tags'
import Player from '../components/Player'
import Templates from '../components/Templates'
import Info from '../components/Info'
import isSuperset from '../models/isSuperset'
import Sidenote from '../components/Sidenote'

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    transcript: null
  }

  state = {
    sidenoteContent: '',
    originalChapters: null,
    currentTime: 0,
    queryTerm: '',
    tags: [],
    chapters: [],
    fields: {
      patient_id: '',
      patient_full_name: ''
    },
    isMediaAudio: true,
    originalTags: [],
    templates: {
      templates: []
    },
    templateId: '',
    originalTemplate: '',
    // defaultTemplate: '',
    sectionHeaders: [],
    initialCursor: 0
  }

  componentDidMount() {
    document.title = 'Inovia AI :: V2t Editor 🎤'
    const { transcript } = this.props
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    if (transcript) {
      this.loadSegments()
    }
  }

  componentDidUpdate(prevProps) {
    const { transcript } = this.props
    const prevId = prevProps.transcript && prevProps.transcript.external_id
    if (transcript && transcript.external_id !== prevId) {
      this.loadSegments()
    }
  }

  loadSegments = async () => {
    const { transcript } = this.props
    // const [preferences] = this.context
    // const { words } = preferences
    const response = await api.loadTranscription(transcript.external_id)
    const templates = await api.getSectionTemplates()
    const originalChapters = this.parseTranscriptions(response.data.transcriptions)
    const { tags, fields, media_content_type, template_id } = response.data
    if (tags) {
      const processedTags = tags.map((tag) => { 
        return { 
          id: tag.id.toUpperCase(),
          description: tag.description
        } 
      })
      this.setState({
        originalChapters,
        tags: processedTags,
        originalTags: processedTags
      })
    } else {
      this.setState({
        originalChapters,
        tags: []
      })
    }

    if (fields) {
      this.setState({ fields })
    } else {
      this.setState({
        fields: {
          patient_id: '',
          patient_full_name: ''
        }
      })
    }

    if (media_content_type) {
      if (media_content_type.match(/^video/) !== null) {
        this.setState({ isMediaAudio: false })
      }
    }

    if (templates) {
      const { data } = templates
      this.setState({
        templates: data,
        defaultTemplate: template_id,
        templateId: template_id,
        originalTemplate: template_id
      }, () => {
        const { templates } = this.state
        const { defaultTemplate } = this.state
        const template = templates
          .templates.find(template => template.id === defaultTemplate)
        const sections = template ? template.sections : []
        const sectionHeaders = sections.map(section => section.name)
        this.setState({ sectionHeaders })
      })
    }
  }

  parseTranscriptions = (transcriptions) => {
    if (transcriptions) {
      return transcriptions.map((transcript) => {
        const keyword = transcript
          .keyword.length ? transcript.keyword : 'Kontaktorsak'
        const segments = transcript.segments.map((chunk, i) => {
          const isLast = i >= transcript.segments.length - 1
          const noSpaceSuffix = isLast || /^\s*$/.test(chunk.words)
          const words = noSpaceSuffix ? chunk.words : `${chunk.words} `
          return {
            ...chunk,
            words: words.replace(/ +$/, ' ')
          }
        })
        return {
          ...transcript,
          keyword,
          segments
        }
      })
    }
    return []
  }

  onTimeUpdate = (currentTime) => {
    this.setState({ currentTime })
  }

  onCursorTimeChange = (cursorTime) => {
    this.setState({ cursorTime })
  }

  getCurrentTime = () => {
    this.playerRef.current.updateTime()
  }

  onSelectText = () => {
    const selctedText = window.getSelection()
      .toString()
    this.setState({ queryTerm: selctedText }, () => {
      this.playerRef.current.searchKeyword()
    })
  }

  finalize = async () => {
    const {
      originalChapters,
      chapters,
      tags,
      originalTags,
      fields,
      templateId,
      originalTemplate
    } = this.state
    if(fields.patient_id){
      if (
        JSON.stringify(originalChapters) === JSON.stringify(chapters) 
        && JSON.stringify(tags) === JSON.stringify(originalTags)
        && originalTemplate === templateId
      ) {
        this.sendToCoworker()
      } else {
        this.save(true)
      }
    } else {
      swal({
        title: 'Det är inte möjligt att skicka till Webdoc.',
        text: 'Personnummer saknas',
        icon: 'error',
        button: 'Ok'
      })
    }
  }



  sendToCoworker = async () => {
    const { transcript } = this.props
    const sendingToCoworker = await api.approveTranscription(transcript.external_id)
      .catch(this.trowAsyncError)
    if (sendingToCoworker) {
      window.location = '/'
    } else {
      swal({
        title: 'Det är inte möjligt att skicka till Webdoc, vänligen prova igen senare.',
        text: '',
        icon: 'error',
        button: 'Ok'
      })
    }
  }

  throwAsyncError = (e) => {
    alert(e)
    throw new Error(e)
  }

  areSectionHeadersBelongToTheTemplate = () => {
    // get the list of templates
    const { templates, templateId, chapters } = this.state
    // const templateNames = templates.templates.map(template=>template.id)
    // get the current template
    // get the list of valid headers
    const sectionHeadersForSelectedTemplate = templates
      .templates
      .filter(template=> template.id===templateId)
      .map(template=>template.sections)[0]
      .map(section=>section.name)
    // get the current headers
    const currentKeyWords = chapters.map(chapter=>chapter.keyword)
    // check if the headers are compatible with the template
    //
    const set1 = new Set(sectionHeadersForSelectedTemplate)
    const set2 = new Set(currentKeyWords)
    // Check if they are same, but having different case
    // Conver the set into array to use map 
    // function and then convert it back to a set
    const set1LowerCase = new Set(
      Array.from(set1).map(keyword=>keyword.toLowerCase())
    )
    const set2LowerCase = new Set(
      Array.from(set2).map(keyword=>keyword.toLowerCase())
    )
    if (isSuperset(set1LowerCase, set2LowerCase)) {
    // check if they are exactly same
      if (isSuperset(set1, set2)) {
        return {
          message: true
        }
      } else {
        // Change the keyword
        const set1Array = Array.from(set1)
        const set2CorrespondingKeywords = Array.from(set2)
        const newKeywords = []
        set2CorrespondingKeywords.forEach(currentKeyword => {
          set1Array.forEach(keyWordFromTemplate=> {
            if (keyWordFromTemplate.toLowerCase() === currentKeyword.toLowerCase()) {
              newKeywords.push(keyWordFromTemplate)
            }
          })
        })

        // this.setState({ chapters: updatedTranscriptHeaders})
        return {
          message: 'FUZZY',
          newKeywords
        }
      }   
    } else {
      return {
        message: false
      } 
    }
  }

  save = async (shouldBeSentToCoworker=false) => {
    const { transcript } = this.props
    const { originalChapters, chapters, tags, originalTags, templateId, originalTemplate } = this.state
    if (JSON.stringify(originalChapters) === JSON.stringify(chapters)
      && JSON.stringify(tags) === JSON.stringify(originalTags)
      && (originalTemplate === templateId)) {
      swal({
        title: 'Det finns inget att uppdatera!',
        text: 'Diktatet är inte ändrat',
        icon: 'info',
        button: 'Ok'
      })
      return
    }

    const headers = chapters.map(chapter => chapter.keyword)
    const uniqueHeaders = Array.from(new Set(headers))
    if (headers.length !== uniqueHeaders.length) {
      swal({
        title: 'Inte möjligt att spara diktatet',
        text: 'Sökord får endast förekomma 1 gång',
        icon: 'info',
        button: 'Ok'
      })
      return
    }

    if (this.areSectionHeadersBelongToTheTemplate().message === false) {
      swal({
        title: 'Inte möjligt att spara diktatet',
        text: 'Det valda sökordet finns inte för mallen',
        icon: 'info',
        button: 'Ok'
      })
      return
    } else if (this.areSectionHeadersBelongToTheTemplate().message === 'FUZZY') {
      const keywordsAfterTemplateChange = this.areSectionHeadersBelongToTheTemplate().newKeywords
      chapters.forEach((chapter, i) => {
        chapter.keyword = keywordsAfterTemplateChange[i]
      })
    }

    chapters.forEach((chapter) => {
      chapter.segments.forEach((segment) => {
        if(/\s$/.test(segment.words)){ segment.words = segment.words.slice(0, -1)}
      })
    })



    try {
      await api.updateTranscription(transcript.external_id, tags, chapters, templateId)
      this.setState({
        originalChapters: this.parseTranscriptions(chapters),
        originalTags: tags
      }, () => {
        swal({
          title: 'Diktatet är uppdaterat',
          text: '',
          icon: 'success',
          button: 'Ok'
        })
        if(shouldBeSentToCoworker===true){
          this.sendToCoworker()
        }
        return true
      })
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
      return false
    }
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  updateSectionHeader = (sectionHeaders) => {
    this.setState({ sectionHeaders })
  }

  updateTemplateId = (templateId) => {
    this.setState({ templateId })
  }

  onUpdateTranscript = (chapters) => {
    this.setState({ chapters })
  }

  onPause = () => {
    const { currentTime } = this.state
    const initialCursor = currentTime
    this.setState({ initialCursor })
  }

  cancel = () => {
    window.location = '/'
  }

  updateSidenote = () => {
    
  }

  render() {
    const { transcript, token } = this.props
    const {
      currentTime,
      cursorTime,
      originalChapters,
      chapters,
      queryTerm,
      tags,
      isMediaAudio,
      fields,
      templates,
      templateId,
      // defaultTemplate,
      sectionHeaders,
      initialCursor,
      sidenoteContent
    } = this.state
    if (!transcript) return null
    return (
      <Page preferences title="Editor">
        <div>
          <Player
            audioTranscript={originalChapters}
            trackId={transcript.external_id}
            cursorTime={cursorTime}
            getCurrentTime={this.getCurrentTime}
            updateSeek={this.onTimeUpdate}
            queryTerm={queryTerm}
            isPlaying={false}
            isContentAudio={isMediaAudio}
            ref={this.playerRef}
            searchBoxVisible
            isTraining={false}
            onPause={this.onPause}
            token={token}
          />
          <EuiSpacer size="l"/>
          <EuiSpacer size="l"/>
          <EuiHorizontalRule margin="xs" />
          <EuiSpacer size="l"/>
          <EuiSpacer size="l"/>

          <EuiFlexGroup wrap gutterSize="xl">
            <EuiFlexItem>
              <Editor
                transcript={transcript}
                originalChapters={originalChapters}
                chapters={chapters}
                currentTime={currentTime}
                onCursorTimeChange={this.onCursorTimeChange}
                onSelect={this.onSelectText}
                updateTranscript={this.onUpdateTranscript}
                isDiffVisible
                sectionHeaders={sectionHeaders}
                initialCursor={initialCursor}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <Info fields={fields} />
              <EuiSpacer size="xxl" />
              <Tags
                tags={tags}
                updateTags={this.onUpdateTags}
              />
              <EuiSpacer size="xxl" />
              <Templates
                listOfTemplates={templates.templates}
                defaultTemplate={templateId}
                updateSectionHeader={this.updateSectionHeader}
                updateTemplateId={this.updateTemplateId}
              />

              <EuiSpacer size="xxl" />
              <Sidenote
                content={sidenoteContent}
                updateSidenote={this.updateSidenote}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="secondary" onClick={this.finalize}>
                Skicka till Webdoc
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="secondary" onClick={this.save}>
                Spara ändringar
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="danger" onClick={this.cancel}>
                Avbryt
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </Page>
    )
  }
}
