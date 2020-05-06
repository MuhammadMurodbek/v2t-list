// @ts-nocheck
/* eslint-disable no-console */
/* eslint-disable react/prop-types */
/* eslint-disable camelcase */
/* eslint-disable no-alert */
import React, { Component } from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiButton,
  EuiHorizontalRule,
  EuiButtonEmpty,
  EuiI18n
} from '@elastic/eui'
import swal from 'sweetalert'
import Invalid from './Invalid'
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
import processChaptersRegular from '../models/processChaptersRegular'
// import processChapters from '../models/processChapters'

const EMPTY_TRANSCRIPTIONS = [{keyword: '', segments: []}]

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    id: -1,
    preloadedTranscript: null
  }

  state = {
    sidenoteContent: '',
    originalChapters: null,
    currentTime: 0,
    queryTerm: '',
    tags: [],
    chapters: [],
    fields: {},
    isMediaAudio: true,
    originalTags: [],
    templates: [],
    templateId: '',
    originalTemplateId: '',
    sectionHeaders: [],
    initialCursor: 0
  }

  componentDidMount() {
    document.title = 'Inovia AI :: V2t Editor 🎤'
    this.playerRef = React.createRef()
    this.editorRef = React.createRef()
    this.tagsRef = React.createRef()
    this.initiate()
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props
    if (id !== prevProps.id) {
      this.initiate()
    }
  }

  initiate = async () => {
    const { id, defaultTranscript } = this.props
    if (defaultTranscript)
      await this.onNewTranscript(defaultTranscript)
    const [ { data: templates }, { data: transcript } ] = await Promise.all([
      api.getSectionTemplates().catch(this.onError),
      api.loadTranscription(id).catch(this.onError)
    ])
    this.onNewTranscript(transcript, templates.templates)
  }

  onNewTranscript = (transcript, templates) => {
    localStorage.setItem('transcriptId', this.props.id)
    const { tags, fields, media_content_type, template_id, transcriptions } = transcript
    const originalTags = (tags || []).map(tag => ({ ...tag, id: tag.id.toUpperCase() }))
    const template = templates.find(template => template.id === template_id) || {}
    this.setState({
      originalTemplateId: template_id,
      originalChapters: this.parseTranscriptions(transcriptions),
      originalTags,
      tags: originalTags,
      fields: fields || {},
      isMediaAudio: (media_content_type || '').match(/^video/) === null,
      templates,
      templateId: template_id,
      sectionHeaders: (template.sections || []).map(({name}) => name)
    })
  }

  parseTranscriptions = (transcriptions) => {
    if (!transcriptions) return EMPTY_TRANSCRIPTIONS
    return transcriptions.map((transcript) => {
      const keyword = transcript.keyword.length
        ? transcript.keyword : 'Kontaktorsak'
      const segments = transcript.segments.map((chunk, i) => {
        const sentenceCase = i > 0 ? chunk.words
          : `${chunk.words.charAt(0).toUpperCase()}${chunk.words.slice(1)}`
        const isLast = i >= transcript.segments.length - 1
        const noSpaceSuffix = isLast || /^\s*$/.test(sentenceCase)
        const words = noSpaceSuffix ? sentenceCase : `${sentenceCase} `
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
    const selctedText = window.getSelection().toString()
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
      originalTemplateId
    } = this.state
    if (fields.patient_id) {
      if (
        JSON.stringify(originalChapters) === JSON.stringify(chapters) &&
        JSON.stringify(tags) === JSON.stringify(originalTags) &&
        originalTemplateId === templateId
      ) {
        this.sendToCoworker()
      } else {
        this.save(true)
      }
    } else {
      swal({
        title: 'Det är inte möjligt att skicka till co-worker.',
        text: 'Personnummer saknas',
        icon: 'error',
        button: 'Ok'
      })
    }
  }

  sendToCoworker = async () => {
    const { id } = this.props
    const sendingToCoworker = await api
      .approveTranscription(id)
      .catch(this.trowAsyncError)
    if (sendingToCoworker) {
      window.location = '/'
    } else {
      swal({
        title:
          'Det är inte möjligt att Skicka till co-worker, vänligen prova igen senare.',
        text: '',
        icon: 'error',
        button: 'Ok'
      })
    }
  }

  areSectionHeadersBelongToTheTemplate = () => {
    // get the list of templates
    const { templates, templateId, chapters } = this.state
    // const templateNames = templates.templates.map(template=>template.id)
    // get the current template
    // get the list of valid headers
    const sectionHeadersForSelectedTemplate = templates
      .filter((template) => template.id === templateId)
      .map((template) => template.sections)[0]
      .map((section) => section.name)
    // get the current headers
    const currentKeyWords = chapters.map((chapter) => chapter.keyword)
    // check if the headers are compatible with the template
    //
    const set1 = new Set(sectionHeadersForSelectedTemplate)
    const set2 = new Set(currentKeyWords)
    // Check if they are same, but having different case
    // Conver the set into array to use map
    // function and then convert it back to a set
    const set1LowerCase = new Set(
      Array.from(set1).map((keyword) => keyword.toLowerCase())
    )
    const set2LowerCase = new Set(
      Array.from(set2).map((keyword) => keyword.toLowerCase())
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
        set2CorrespondingKeywords.forEach((currentKeyword) => {
          set1Array.forEach((keyWordFromTemplate) => {
            if (
              keyWordFromTemplate.toLowerCase() === currentKeyword.toLowerCase()
            ) {
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

  save = async (shouldBeSentToCoworker = false) => {
    const { id } = this.props
    const {
      originalChapters,
      chapters,
      tags,
      originalTags,
      templateId,
      originalTemplateId
    } = this.state
    if (
      JSON.stringify(originalChapters) === JSON.stringify(chapters) &&
      JSON.stringify(tags) === JSON.stringify(originalTags) &&
      originalTemplateId === templateId
    ) {
      swal({
        title: 'Det finns inget att uppdatera!',
        text: 'Diktatet är inte ändrat',
        icon: 'info',
        button: 'Ok'
      })
      return
    }

    const headers = chapters.map((chapter) => chapter.keyword)
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
    } else if (
      this.areSectionHeadersBelongToTheTemplate().message === 'FUZZY'
    ) {
      const keywordsAfterTemplateChange = this.areSectionHeadersBelongToTheTemplate()
        .newKeywords
      chapters.forEach((chapter, i) => {
        chapter.keyword = keywordsAfterTemplateChange[i]
      })
    }

    chapters.forEach((chapter) => {
      chapter.segments.forEach((segment) => {
        if (/\s$/.test(segment.words)) {
          segment.words = segment.words.slice(0, -1)
        }
      })
    })

    try {
      await api.updateTranscription(
        id,
        tags,
        chapters,
        templateId
      )
      this.setState(
        {
          originalChapters: this.parseTranscriptions(chapters),
          originalTags: tags
        },
        () => {
          swal({
            title: 'Diktatet är uppdaterat',
            text: '',
            icon: 'success',
            button: 'Ok'
          })
          if (shouldBeSentToCoworker === true) {
            this.sendToCoworker()
          }
          return true
        }
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
      return false
    }
  }

  onUpdateTags = (tags) => {
    this.setState({ tags })
  }

  updateTemplateId = (templateId) => {
    const { chapters, templates } = this.state
    const template = templates.find(template => template.id === templateId)
    const availableSectionHeaders = this.getAvailableSectionHeaders(template)
    const sectionHeaders = (template.sections || []).map(({name}) => name)
    const updatedChapters = processChaptersRegular(chapters, availableSectionHeaders)
    this.setState({ templateId, sectionHeaders, chapters: updatedChapters })
  }

  getAvailableSectionHeaders = (template) => {
    if (template.sections)
      return template.sections.reduce((store, {name, synonyms}) => {
        return [...store, name, ...(synonyms || [])]
      }, [])
  }

  onUpdateTranscript = (chapters) => {
    return new Promise(resolve => this.setState({ chapters }, resolve))
  }

  onPause = () => {
    const { currentTime } = this.state
    const initialCursor = currentTime
    this.setState({ initialCursor })
  }

  cancel = () => {
    window.location = '/'
  }

  updateSidenote = () => {}

  onError = (error) => {
    this.setState({error})
  }

  render() {
    const { id, token } = this.props
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
      sidenoteContent,
      error
    } = this.state
    if (error) return <Invalid />
    return (
      <Page preferences title={<EuiI18n token="editor" default="Editor" />}>
        <div>
          <Player
            audioTranscript={originalChapters}
            trackId={id}
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
          <EuiSpacer size="l" />
          <EuiSpacer size="l" />
          <EuiHorizontalRule margin="xs" />
          <EuiSpacer size="l" />
          <EuiSpacer size="l" />

          <EuiFlexGroup wrap gutterSize="xl">
            <EuiFlexItem>
              <Editor
                originalChapters={originalChapters}
                chapters={chapters}
                currentTime={currentTime}
                onCursorTimeChange={this.onCursorTimeChange}
                onSelect={this.onSelectText}
                updateTranscript={this.onUpdateTranscript}
                isDiffVisible
                templateId={templateId}
                sectionHeaders={sectionHeaders}
                initialCursor={initialCursor}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <Info fields={fields} />
              <EuiSpacer size="xxl" />
              <Tags tags={tags} updateTags={this.onUpdateTags} />
              <EuiSpacer size="xxl" />
              <Templates
                listOfTemplates={templates}
                defaultTemplateId={templateId}
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
              <EuiButtonEmpty color="#000000" onClick={this.cancel}>
                <EuiI18n token="cancel" default="Cancel" />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                color="subdued"
                style={{
                  border: 'solid 1px black',
                  borderRadius: '25px'
                }}
                onClick={this.save}
              >
                <EuiI18n token="saveChanges" default="Save Changes" />
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                style={{
                  background: 'rgb(9, 99, 255)',
                  color: 'white',
                  borderRadius: '25px'
                }}
                onClick={this.finalize}
              >
                <EuiI18n token="sendToWebdoc" default="Send to Co-worker" />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </Page>
    )
  }
}
