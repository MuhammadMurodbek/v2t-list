/* eslint-disable no-console */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-unused-prop-types */
import React, { Component } from 'react'
import Diff from 'text-diff'
import PropTypes from 'prop-types'
import { PreferenceContext } from './PreferencesProvider'
import FullDiff from '../components/FullDiff'
import EditableChapters from '../components/EditableChapters'
import AddedLine from '../components/AddedLine'
import RemovedLine from '../components/RemovedLine'
import HeaderLine from '../components/HeaderLine'
import reduceSegment from '../utils/reduceSegment'
import '../styles/editor.css'
import EventEmitter from '../models/events'
import { EVENTS } from '../components/EventHandler'

const NEW_KEYWORD = 'New Chapter'
const KEYCODE_ENTER = 13
const KEYCODE_BACKSPACE = 8
const KEYCODE_DELETE = 46
const HEADER_TYPE = 72
const ILLEGAL_CHARS_REGEX = /˜/g
export default class Editor extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    diffInstance: new Diff(),
    originalChapters: null,
    chapters: null,
    currentTime: 0,
    initialCursor: 0,
    recordingChapter: null,
    noDiff: false
  }

  static propTypes = {
    diffInstance: PropTypes.instanceOf(Diff),
    originalChapters: PropTypes.array,
    chapters: PropTypes.array,
    currentTime: PropTypes.number.isRequired,
    initialCursor: PropTypes.number.isRequired,
    recordingChapter: PropTypes.number,
    schema: PropTypes.object.isRequired,
    updateTranscript: PropTypes.func.isRequired,
    onCursorTimeChange: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    isDiffVisible: PropTypes.bool,
    service: PropTypes.object.isRequired
  }

  state = {
    diff: null,
    error: []
  }

  componentDidMount() {
    this.inputRef = React.createRef()
    this.initChapters()
    EventEmitter.subscribe(EVENTS.UNDO, this.undo)
    EventEmitter.subscribe(EVENTS.REDO, this.redo)
  }

  componentDidUpdate(prevProps) {
    const { initialCursor, schema, originalChapters } = this.props
    if (initialCursor && prevProps.initialCursor !== initialCursor)
      this.setCursor(false)
    else this.updateCursor()

    if (
      JSON.stringify(prevProps.originalChapters) !==
      JSON.stringify(originalChapters)
    ) {
      this.initChapters()
    }

    if (prevProps.schema && prevProps.schema.id !== schema.id)
      this.refreshDiff()
  }

  componentWillUnmount() {
    EventEmitter.unsubscribe(EVENTS.UNDO)
    EventEmitter.unsubscribe(EVENTS.REDO)
  }

  initChapters = () => {
    // eslint-disable-next-line no-unused-vars
    const { originalChapters, updateTranscript } = this.props
    if (originalChapters) {
      this.refreshDiff()
    }
  }

  undo = () => {
    this.props.service.send({ type: 'UNDO' })
    this.refreshDiff()
  }

  redo = () => {
    this.props.service.send({ type: 'REDO' })
    this.refreshDiff()
  }

  setCursor = (select) => {
    const { recordingChapter } = this.props
    const cursor =
      recordingChapter === null
        ? this.timestampCursor(select)
        : this.recordingCursorLast()
    this.stashCursorAt(cursor)
    const container = this.getSelectedElement()
    const element = container.firstChild || container
    element.parentElement.scrollIntoView(false)
    this.updateCursor()
  }

  timestampCursor = (select) => {
    const { initialCursor, chapters } = this.props
    return (
      chapters.reduce((store, { segments }, chapter) => {
        const segment = segments.findIndex(
          ({ startTime }, i) =>
            startTime > initialCursor ||
            (i === segments.length - 1 && chapter === chapters.length - 1)
        )
        return !store && segment >= 0
          ? {
            chapter,
            segment,
            offset: segments[segment].words.length - 1,
            select
          }
          : store
      }, null) || { chapter: 0, segment: 0, offset: 0, select }
    )
  }

  recordingCursorLast = () => {
    const { recordingChapter, chapters } = this.props
    const chapter = chapters[recordingChapter] || chapters[recordingChapter - 1]
    const { segments } = chapter
    const segment = segments[segments.length - 1]
    return segment
      ? {
        chapter: recordingChapter,
        segment: segments.length - 1,
        offset: segment.words.length - 1,
        select: false
      }
      : { chapter: recordingChapter, segment: 0, offset: 0, select: false }
  }

  updateCursor = () => {
    if (!this.inputRef || !this.inputRef.current) return
    if (this.cursor) {
      return this.popCursor()
    }
    const newKeyword = Object.values(
      this.inputRef.current.getElementsByTagName('h2')
    ).find((element) => element.innerText === NEW_KEYWORD)
    if (newKeyword) {
      newKeyword.focus()
    }
  }

  stashCursor = (offset = 0, overrideSegment = null) => {
    const range = window.getSelection().getRangeAt(0)
    const node = range.startContainer
    const sibling = node.previousSibling
    const willMerge = sibling && sibling.textContent.slice(-1) !== ' '
    const siblingOffset = willMerge ? sibling.textContent.length : 0
    const dataset = this.getDatasetRecursive(node)
    this.stashCursorAt({
      keyword: Number(dataset.keyword),
      chapter: Number(dataset.chapter),
      segment:
        overrideSegment === null
          ? Number(dataset.segment || 0)
          : overrideSegment,
      offset: range.startOffset + siblingOffset + offset
    })
    if (isNaN(this.cursor.keyword) && this.cursor.offset < 0)
      this.alignCursorToPreviousSegment()
  }

  stashCursorAt = (cursor) => {
    this.cursor = cursor
  }

  popCursor = () => {
    const { offset, select } = this.cursor
    const selection = window.getSelection()
    const range = document.createRange()
    if (selection.rangeCount > 0) selection.removeAllRanges()
    const container = this.getSelectedElement()
    const element = container.firstChild || container
    if(element.textContent) {
      const textLength = element.textContent.length
      const safeOffset = Math.min(offset, textLength)
      if (safeOffset !== offset)
        console.error('Offset was too large, fallback to element text length')
      const startOffset = select ? 0 : safeOffset
      const endOffset = select && textLength ? textLength - 1 : safeOffset
      range.setStart(element, startOffset)
      range.setEnd(element, endOffset)
      selection.addRange(range)
    } 
    this.stashCursorAt(null)
  }

  onCursorChange = () => {
    const { chapters, onCursorTimeChange } = this.props
    const selection = window.getSelection()
    const chapterId = Number(
      selection.anchorNode.parentNode.dataset.chapter || 0
    )
    const segmentId = Number(
      selection.anchorNode.parentNode.dataset.segment || 0
    )
    const segment =
      chapters[chapterId] && chapters[chapterId].segments[segmentId]
    const timestamp = segment ? segment.startTime || 0 : 0
    const timestampStart = segment ? segment.startTime || 0 : 0
    const timestampEnd = segment ? segment.endTime || 0 : 0
    onCursorTimeChange(
      timestamp,
      chapterId,
      segmentId,
      timestampStart,
      timestampEnd
    )
  }

  getDatasetRecursive = (node) => {
    const sibling = node.previousSibling
    const siblingDataset = sibling ? sibling.dataset : null
    const hasDataset = Object.keys(siblingDataset || node.dataset || {}).length
    if (!hasDataset) return this.getDatasetRecursive(node.parentNode)
    // rely on the previous and unchanged segment
    let segment = siblingDataset ? Number(siblingDataset.segment) : 0
    const willMerge = sibling && sibling.textContent.slice(-1) !== ' '
    if (sibling && !willMerge) segment++
    return { ...siblingDataset, ...node.dataset, segment }
  }

  getSelectedElement = () => {
    if (!isNaN(this.cursor.keyword)) {
      return this.getSelectedKeywordElement()
    }
    // eslint-disable-next-line max-len
    const filter = `[data-chapter='${this.cursor.chapter}'][data-segment='${this.cursor.segment}']`
    const fallbackFilter = `[data-chapter='${this.cursor.chapter}']`
    if (document.querySelector(filter)===null) {
      return(<></>)
    }

    return (
      document.querySelector(filter) ||
        document.querySelector(fallbackFilter).lastChild
    )
  }

  getSelectedKeywordElement = () => {
    const h2 = document.querySelector(`[data-keyword='${this.cursor.keyword}']`)
    return h2.firstChild || h2
  }

  alignCursorToPreviousSegment = () => {
    const { chapters } = this.props
    const cursor = this.cursor
    cursor.segment--
    if (cursor.segment < 0) {
      cursor.chapter--
      cursor.segment = chapters[cursor.chapter].segments.length - 1
    }
    const newSegment = chapters[cursor.chapter].segments[cursor.segment]
    cursor.offset = newSegment ? newSegment.words.length : 0
    cursor.segment = newSegment ? cursor.segment : 0
    this.stashCursorAt(cursor)
  }

  onChange = (e, chapterId) => {
    const { updateTranscript } = this.props
    const illegalCharacters =
      e.target.innerText.match(ILLEGAL_CHARS_REGEX) || []
    this.stashCursor(-illegalCharacters.length)
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (e.target.nodeName === 'H2')
      return this.updateKeyword(chapterId, e.target.innerText)
    chapters[chapterId] = this.parseChapter(e.target, chapterId)
    updateTranscript(chapters).then(this.refreshDiff)
  }

  /* Make sure only text is pasted and override 
  browsers default replacment of new lines */
  // eslint-disable-next-line no-unused-vars
  onPaste = (e, chapterId) => {
    e.preventDefault()
    const text =
      (e.originalEvent || e).clipboardData.getData('text/plain') || ''
    document.execCommand('insertHTML', false, this.escapeHTML(text))
  }

  

  escapeHTML = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }

  onKeyDown = (e, chapterId) => {
    const selection = window.getSelection()
    const segmentId = Number(
      selection.anchorNode.parentNode.dataset.segment || 0
    )
    if (e.keyCode === KEYCODE_ENTER && e.shiftKey) {
      this.insertNewline(e, chapterId, segmentId)
    }
    if (e.keyCode === KEYCODE_BACKSPACE && selection.toString()) {
      this.removeSelection(e, chapterId, selection)
    }
    this.handleChapterChange(e, chapterId, segmentId)
  }

  removeSelection = (e, chapterId, selection) => {
    const { chapters, updateTranscript } = this.props
    const firstSegmentId = Number(
      selection.anchorNode.parentNode.dataset.segment || 0
    )
    const lastSegmentId = Number(
      selection.focusNode.parentNode.dataset.segment || 0
    )
    const { segments } = chapters[chapterId]
    // Workaround when browser adds <br> element
    // (https://gitlab.inoviagroup.se/patronum/v2t/ui/v2t-list/-/issues/248)
    if (
      lastSegmentId === firstSegmentId &&
      lastSegmentId === segments.length - 1 &&
      segments[lastSegmentId].words.includes('\n')
    ) {
      e.preventDefault()
      const { startOffset, endOffset } = window.getSelection().getRangeAt(0)

      const charArray = segments[lastSegmentId].words.split('')
      if (charArray[startOffset - 1] === '\n') {
        charArray[startOffset - 1] = ''
        this.stashCursor(-1)
      } else {
        this.stashCursor(0)
      }
      charArray.splice(startOffset, endOffset - startOffset)

      segments[lastSegmentId].words = charArray.join('')
      chapters[chapterId].segments = segments
      updateTranscript(chapters, true).then(this.refreshDiff)
    }
  }

  insertNewline = (e, chapterId, segmentId) => {
    const { chapters, updateTranscript } = this.props
    e.preventDefault()
    this.stashCursor(1)
    const range = window.getSelection().getRangeAt(0)
    const selectedLength = range.endOffset - range.startOffset
    const segments = chapters[chapterId].segments
    if (!segments[segmentId])
      segments[segmentId] = { startTime: 0, endTime: 0, words: '' }
    const charArray = segments[segmentId].words.split('')
    const isLastSegmentChar =
      segments.length - 1 === segmentId &&
      charArray.length === range.startOffset

    charArray.splice(
      range.startOffset,
      selectedLength,
      `\n${isLastSegmentChar ? '\u200c' : ''}`
    )
    segments[segmentId].words = charArray.join('')
    chapters[chapterId].segments = segments
    updateTranscript(chapters, true).then(this.refreshDiff)
  }

  updateKeyword = (id, value) => {
    const { updateTranscript } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    chapters[id].keyword = value.replace(/\r?\n|\r/g, '')
    // retrieve the new schema setup based on dependednt field
    updateTranscript(chapters, true, id).then(this.refreshDiff)
  }

  splitChapter = (e, chapterId, segmentId, isComplicatedField=false) => {
    const { updateTranscript, schema } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    e.preventDefault()
    if(!isComplicatedField){
      const range = window.getSelection().getRangeAt(0)
      const chapter = chapters[chapterId]
      const segment = chapter.segments[segmentId]
      if (!segment) return
      const nextSegment = { ...segment }
      nextSegment.words = nextSegment.words.slice(range.startOffset).trimStart()
      const usedKeywords = chapters.map(({ keyword }) => keyword)
      const nextField = schema.fields
        .filter(({ visible }) => visible)
        .find(({ id }) => !usedKeywords.includes(id))
      let nextChapter = {
        keyword: nextField ? nextField.id : '',
        segments: [
          nextSegment,
          ...chapters[chapterId].segments.slice(segmentId + 1)
        ].filter((segment) => segment.words.length)
      }
      // capitalize the first letter of the new segment
      const updatedSegments = []
      nextChapter.segments.forEach((seg, segmentIndex) => {
        if (segmentIndex === 0) {
          const updatedWords =
            seg.words.charAt(0).toUpperCase() + seg.words.slice(1)
          updatedSegments.push({ ...seg, words: updatedWords })
        } else {
          updatedSegments.push(seg)
        }
      })
      nextChapter = { ...nextChapter, segments: updatedSegments }
      const prevSegment = { ...segment }
      prevSegment.words = prevSegment.words
        .slice(0, range.startOffset)
        .trimEnd()
      chapters[chapterId].segments = [
        ...chapter.segments.slice(0, segmentId),
        prevSegment
      ].filter((segment) => segment.words.length)
      chapters.splice(chapterId + 1, 0, nextChapter)
      this.stashCursorAt({ chapter: chapterId + 1, segment: 0, offset: 0 })
      updateTranscript(chapters, true).then(this.refreshDiff)
    } else {
      const chapter = chapters[chapterId]
      const segment = chapter.segments[segmentId]
      if (!segment) return
      const usedKeywords = chapters.map(({ keyword }) => keyword)
      const nextField = schema.fields
        .filter(({ visible }) => visible)
        .find(({ id }) => !usedKeywords.includes(id))
      const nextChapter = {
        keyword: nextField ? nextField.id : '',
        segments: []
      }
      chapters.splice(chapterId + 1, 0, nextChapter)
      this.stashCursorAt({ chapter: chapterId + 1, segment: 0, offset: 0 })
      updateTranscript(chapters, true).then(this.refreshDiff)
    }
  }

  handleChapterChange = (e, chapterId, segmentId) => {
    const lastSegmentId = this.props.chapters[chapterId].segments.length - 1
    const textContent = e.target.childNodes[segmentId].textContent
    const range = window.getSelection().getRangeAt(0)
    const isBeginningSelected =
      this.spaceInfront(e, segmentId) === 0 && range.endOffset === 0
    const isEndingSelected =
      segmentId === lastSegmentId && range.startOffset === textContent.length
    if (e.keyCode === KEYCODE_ENTER && !e.shiftKey) {
      this.splitChapter(e, chapterId, segmentId)
    } else if (isBeginningSelected && e.keyCode === KEYCODE_BACKSPACE) {
      this.mergeChapter(e, chapterId, chapterId - 1, -1, 0)
    } else if (isEndingSelected && e.keyCode === KEYCODE_DELETE) {
      this.mergeChapter(e, chapterId + 1, chapterId)
    }
  }

  spaceInfront = (e, segmentId) => {
    let space = 0
    for (let i = 0; i < segmentId; i++)
      space += e.target.childNodes[i].textContent.replace(/[\u200c]/g, '')
        .length
    return space
  }

  mergeChapter = (
    e,
    fromChapterId,
    toChapterId,
    cursorOffset,
    overrideSegment = null
  ) => {
    const { updateTranscript } = this.props
    e.preventDefault()
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (!chapters[fromChapterId] || !chapters[toChapterId]) return null
    this.stashCursor(cursorOffset, overrideSegment)
    chapters[toChapterId].segments.push(...chapters[fromChapterId].segments)
    chapters.splice(fromChapterId, 1)
    updateTranscript(chapters, true).then(this.refreshDiff)
  }

  parseChapter = (target, chapterId) => {
    const { chapters } = this.props
    const segments = Array.from(target.childNodes).reduce(
      (store, child, i, array) => {
        const segment = this.parseSegment(child, chapterId, i)
        return reduceSegment(store, segment, i, array)
      },
      []
    )

    // Check for autocorrect
    if (segments[this.cursor.segment]) {
      if (segments[this.cursor.segment].words) {
        const currentWords = segments[this.cursor.segment].words
        const autoCorrectEntries = JSON.parse(
          localStorage.getItem('autoCorrect')
        )
        const autoCorrectEntriesObj = {}
        autoCorrectEntries.forEach(
          (autocorrectEntry) =>
            (autoCorrectEntriesObj[autocorrectEntry.shortcut] =
              autocorrectEntry.value)
        )
        const autoCorrectAcronyms = autoCorrectEntries.map((aV) =>
          aV.shortcut.trim()
        )
        const currentWordsSplittedBySpace = currentWords.split(' ')
        const updatedCurrentWords = currentWordsSplittedBySpace.map(
          (currentWord) => {
            if (autoCorrectAcronyms.includes(currentWord.trim())) {
              return autoCorrectEntriesObj[currentWord.trim()]
            } else {
              return currentWord
            }
          }
        )

        const initialSegmentLength = segments[this.cursor.segment].words.length
        segments[this.cursor.segment].words = updatedCurrentWords.join(' ')
        const currentSegmentLength = segments[this.cursor.segment].words.length
        if (initialSegmentLength !== currentSegmentLength) {
          // put the cursor at the end
          const cursor = this.cursor
          cursor.offset =
            segments[this.cursor.segment].words.length -
            (initialSegmentLength - cursor.offset)
          this.stashCursorAt(cursor)
        }
      }
    }

    return { ...chapters[chapterId], segments }
  }

  parseSegment = (child, chapterId, i) => {
    this.removeInvalidChars(child)
    const { chapters } = this.props
    const segmentId = child.dataset ? Number(child.dataset.segment || 0) : null
    const segments = chapters[chapterId].segments
    const storedWords = segments[i] ? segments[i].words : ''
    const words = child.textContent.replace(/^[\u200c]+/, (match) =>
      storedWords.slice(0, match.length)
    )
    return { startTime: 0, endTime: 0, ...segments[segmentId], words }
  }

  removeInvalidChars = (child) => {
    child.textContent = child.textContent.replace(ILLEGAL_CHARS_REGEX, '')
  }

  refreshDiff = () => {
    const { chapters } = this.props
    const diff = this.getDiff(chapters)
    this.setState({ diff })
  }

  getDiff = (chapters) => {
    const { originalChapters } = this.props
    if (!this.inputRef || !this.inputRef.current) return null

    const mapContentFunction = ({ id, keyword, segments }) => ({
      id,
      keyword,
      text: segments.map((segment) => segment.words).join('')
    })
    const content = chapters.map(mapContentFunction)
    const originalContent = originalChapters.map(mapContentFunction)
    const noContent =
      [...content, ...originalContent].map(({ text }) => text).join('') === ''
    if (noContent) return null

    let deletedContentDiff = []
    originalContent.forEach(
      ({ id: originalId, keyword: originalKeyword, text: originalText }) => {
        let isContentDeleted = true
        content.forEach(({ id }) => {
          if (id === originalId) {
            isContentDeleted = false
          }
        })
        if (isContentDeleted) {
          deletedContentDiff = deletedContentDiff.concat([
            // [0]: 0 - hide header, 1 - show header
            [1, HEADER_TYPE, originalKeyword, null],
            [-1, originalText]
          ])
        }
      }
    )

    const diff = content
      .reduce(
        (store, chapter) => this.reduceDiff(store, chapter, originalContent),
        []
      )
      .concat(deletedContentDiff)

    return diff.map((d, i) => this.parseDiff(i, d, diff)).filter((d) => d)
  }

  /**
   * Used as callback function of Array.prototype.reduce()
   */
  reduceDiff = (store, { id, keyword, text }, originalContent) => {
    const { diffInstance } = this.props
    let currentDiff
    originalContent.forEach((originalChapter) => {
      if (originalChapter.id === id) {
        // generate difference arrays
        const textDiffs = diffInstance.main(originalChapter.text, text)

        diffInstance.cleanupSemantic(textDiffs)

        let keywordDiff
        if (
          textDiffs.length === 1 &&
          textDiffs[0][0] === 0 &&
          originalChapter.keyword === keyword
        ) {
          // [0]: 0 - hide header, 1 - show header
          keywordDiff = [0, HEADER_TYPE, originalChapter.keyword, keyword]
        } else {
          // add keyword/s if there is any change in text or in keyword
          keywordDiff = [1, HEADER_TYPE, originalChapter.keyword, keyword]
        }
        currentDiff = [keywordDiff, ...textDiffs]
      }
    })

    if (currentDiff) {
      return [...store, ...currentDiff]
    }
    // otherwise all this chapter is newly added
    return [
      ...store,
      [1, HEADER_TYPE, null, keyword], // add header type
      [1, text]
    ]
  }

  parseDiff = (i, thisDiff, diff) => {
    const prevDiff = this.getRelativeDiffText(diff.slice(0, i).reverse())
    const nextDiff = this.getRelativeDiffText(diff.slice(i))

    // [0]: 0 - hide header, 1 - show header
    if (thisDiff[0] === 1 && thisDiff[1] === HEADER_TYPE) {
      // header type
      return (
        <HeaderLine key={i} header={thisDiff[2]} updatedHeader={thisDiff[3]} />
      )
    }
    if (thisDiff[0] === -1) {
      return (
        <RemovedLine
          key={i}
          diff={thisDiff}
          prevDiff={prevDiff}
          nextDiff={nextDiff}
        />
      )
    }
    if (thisDiff[0] === 1) {
      return (
        <AddedLine
          key={i}
          diff={thisDiff}
          prevDiff={prevDiff}
          nextDiff={nextDiff}
        />
      )
    }
    return null
  }

  getRelativeDiffText = (diffArray) => {
    const defaultReturnValue = [1, ' ']
    for (const diff of diffArray) {
      if (diff[1] === HEADER_TYPE) {
        return defaultReturnValue
      } else if (diff[0] === 0) {
        return diff
      }
    }
    return defaultReturnValue
  }

  setKeyword = (keywordValue, chapterId) => {
    const { schema } = this.props
    const keywordId = schema.fields.find((field) => field.name === keywordValue)
      .id
    this.updateKeyword(chapterId, keywordId)
  }

  createNewSectionAfterThis = (chapterId) => {
    this.splitChapter(
      new KeyboardEvent('keydown', {
        code: 'Enter',
        key: 'Enter',
        charCode: 13,
        keyCode: 13,
        view: window,
        bubbles: true
      }),
      chapterId,
      0, true
    )
  }
  
  render() {
    const {
      recordingChapter,
      currentTime,
      chapters,
      onSelect,
      noDiff,
      schema,
      complicatedFieldOptions,
      singleSelectFieldOptions,
      updateComplicatedFields,
      deleteComplicatedField
    } = this.props
    const { diff, error } = this.state
    const { preferences } = this.context
    if (!chapters) return null
    return (
      <>
        <EditableChapters
          chapters={chapters}
          inputRef={this.inputRef}
          currentTime={currentTime}
          onChange={this.onChange}
          onPaste={this.onPaste}
          complicatedFieldOptions={complicatedFieldOptions}
          singleSelectFieldOptions={singleSelectFieldOptions}
          // onChangeComplicatedField={this.onChangeComplicatedField}
          // updateComplicatedFieldOptions={updateComplicatedFieldOptions}
          updateComplicatedFields={updateComplicatedFields}
          deleteComplicatedField={deleteComplicatedField}
          onKeyDown={this.onKeyDown}
          onSelect={onSelect}
          onCursorChange={this.onCursorChange}
          error={error}
          context={preferences}
          schema={schema}
          setKeyword={this.setKeyword}
          recordingChapter={recordingChapter}
          createNewSectionAfterThis={this.createNewSectionAfterThis}
        />
        {!noDiff && <FullDiff diff={diff} />}
      </>
    )
  }
}
