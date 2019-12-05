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

export default class EditPage extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    transcript: null
  }

  state = {
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
      this.setState({
        originalChapters,
        tags,
        originalTags: tags
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
          const template = templates.templates.find(template => template.id === defaultTemplate)
          const sections = template ? template.sections : []
          const sectionHeaders = sections.map(section => section.name)
          this.setState({ sectionHeaders})
        })
    }
  }

  parseTranscriptions = (transcriptions) => {
    if (transcriptions) {
      return transcriptions.map((transcript) => {
        const keyword = transcript.keyword.length ? transcript.keyword : 'Kontaktorsak'
        const segments = transcript.segments.map((chunk, i) => {
          const words = i >= transcript.segments.length - 1 ? chunk.words : `${chunk.words} `
          return {
            ...chunk,
            words
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
      originalTags
    } = this.state

    if (JSON.stringify(originalChapters) === JSON.stringify(chapters) && JSON.stringify(tags) === JSON.stringify(originalTags)) {
      this.sendToCoworker()
    } else {
      await this.save()
      this.sendToCoworker()
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
        title: 'Det är inte möjligt att skicka till Co-Worker, vänligen prova igen senare.',
        text: '',
        icon: 'error',
        button: 'Avbryt'
      })
    }
  }

  throwAsyncError = (e) => {
    alert(e)
    throw new Error(e)
  }

  save = async () => {
    const { transcript } = this.props
    const { originalChapters, chapters, tags, originalTags, templateId, originalTemplate } = this.state
    if (JSON.stringify(originalChapters) === JSON.stringify(chapters)
      && JSON.stringify(tags) === JSON.stringify(originalTags)
      && (originalTemplate === templateId)) {
      swal({
        title: 'Det finns inget att uppdatera!',
        text: 'Diktatet är inte ändrat',
        icon: 'info',
        button: 'Avbryt'
      })
      return
    }

    const headers = chapters.map(chapter => chapter.keyword)
    const uniqueHeaders = Array.from(new Set(headers))
    if (headers.length !== uniqueHeaders.length) {
      swal({
        title: 'Inte möjligt att spara diktatet',
        text: 'Journalrubrik får endast förekomma 1 gång',
        icon: 'info',
        button: 'Avbryt'
      })
      return
    }

    chapters.forEach((chapter) => {
      chapter.segments.forEach((segment) => {
        if(/\s$/.test(segment.words)){ segment.words = segment.words.slice(0, -1)}
      })
    })

    api.updateTranscription(transcript.external_id, tags, chapters, templateId)
      .then(() => {
        this.setState({
          originalChapters: this.parseTranscriptions(chapters),
          originalTags: tags
        }, () => {
          swal({
            title: 'Diktatet är uppdaterat',
            text: '',
            icon: 'success',
            button: 'Avbryt'
          })
          return true
        })
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error)
        return false
      })
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
    console.log(chapters)
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

  render() {
    const { transcript } = this.props
    const {
      currentTime,
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
      initialCursor
    } = this.state
    if (!transcript) return null
    return (
      <Page preferences title="Editor">
        <div>
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <figure>
                <Player
                  audioTranscript={originalChapters}
                  trackId={transcript.external_id}
                  getCurrentTime={this.getCurrentTime}
                  updateSeek={this.onTimeUpdate}
                  queryTerm={queryTerm}
                  isPlaying={false}
                  isContentAudio={isMediaAudio}
                  ref={this.playerRef}
                  searchBoxVisible
                  isTraining={false}
                  onPause={this.onPause}
                />
                <EuiSpacer size="l"/>
                <EuiSpacer size="l"/>
                <EuiHorizontalRule margin="xs" />
              </figure>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="l"/>
          <EuiSpacer size="l"/>

          <EuiFlexGroup wrap gutterSize="xl">
            <EuiFlexItem>
              <Editor
                transcript={transcript}
                originalChapters={originalChapters}
                chapters={chapters}
                currentTime={currentTime}
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
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="secondary" onClick={this.finalize}>Skicka till
                Co-Worker</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="secondary" onClick={this.save}>Spara ändringar</EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton fill color="danger" onClick={this.cancel}>Avbryt</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </Page>
    )
  }
}
