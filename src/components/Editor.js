import React, { Component } from 'react'
import Diff from 'text-diff'
import PropTypes from 'prop-types'
import {
  EuiFormRow,
  EuiText,
  EuiTextColor,
  EuiSpacer
} from '@patronum/eui'

import { PreferenceContext } from './PreferencesProvider'
import SectionHeader from '../components/SectionHeader'
import '../styles/editor.css'

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
    noDiff: false
  }

  static propTypes = {
    diffInstance: PropTypes.instanceOf(Diff),
    originalChapters: PropTypes.array,
    chapters: PropTypes.array,
    currentTime: PropTypes.number.isRequired,
    initialCursor: PropTypes.number.isRequired,
    schema: PropTypes.object.isRequired,
    updateTranscript: PropTypes.func.isRequired,
    onCursorTimeChange: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    isDiffVisible: PropTypes.bool
  }

  state = {
    diff: null,
    error: []
  }

  componentDidMount() {
    this.inputRef = React.createRef()
    this.initChapters()
  }

  componentDidUpdate(prevProps) {
    const { initialCursor, schema, originalChapters } = this.props
    if (initialCursor && prevProps.initialCursor !== initialCursor)
      this.setCursor(initialCursor, false)
    else
      this.updateCursor()

    if (JSON.stringify(prevProps.originalChapters) !== JSON.stringify(originalChapters)) {
      this.initChapters()
    }

    if (prevProps.schema && prevProps.schema.id !== schema.id)
      this.refreshDiff()
  }

  initChapters = () => {
    const { originalChapters, updateTranscript } = this.props
    if (originalChapters) {
      const chapters = originalChapters.map((chapter) => {
        const segments = chapter.segments.reduce(this.reduceSegment, [])
        return { ...chapter, segments }
      })
      updateTranscript(chapters).then(this.refreshDiff)
    }
  }

  setCursor = (timestamp, select) => {
    const { chapters } = this.props
    const cursor = chapters.reduce((store, { segments }, chapter) => {
      const segment = segments.findIndex(({ startTime }, i) =>
        startTime > timestamp || (i === segments.length - 1 && chapter === chapters.length -1)
      )
      return !store && segment >= 0 ? {
        chapter,
        segment,
        offset: segments[segment].words.length - 1,
        select
      } : store
    }, null) || { chapter: 0, segment: 0, offset: 0, select }
    this.stashCursorAt(cursor)
    const container = this.getSelectedElement()
    const element = container.firstChild || container
    element.parentElement.scrollIntoView(false)
    this.updateCursor()
  }

  updateCursor = () => {
    if (!this.inputRef || !this.inputRef.current) return
    if (this.cursor) {
      return this.popCursor()
    }
    const newKeyword = Object.values(this.inputRef.current.getElementsByTagName('h2'))
      .find(element => element.innerText === NEW_KEYWORD)
    if (newKeyword) {
      newKeyword.focus()
    }
  }

  stashCursor = (offset = 0) => {
    const range = window.getSelection().getRangeAt(0)
    const node = range.startContainer
    // firefox paste #text into a sibling before it is merged into one #text element
    const siblingOffset = node.previousSibling && node.previousSibling.data ?
      node.previousSibling.data.length : 0
    const dataset = this.getClosestDataset(node)
    this.stashCursorAt({
      keyword: Number(dataset.keyword),
      chapter: Number(dataset.chapter),
      segment: Number(dataset.segment || 0),
      offset: range.startOffset + siblingOffset + offset
    })
    if (isNaN(this.cursor.keyword) && this.cursor.offset < 0)
      this.alignCursorToPreviousSegment()
  }

  stashCursorAt = cursor => {
    this.cursor = cursor
  }

  popCursor = () => {
    const { offset, select } = this.cursor
    const selection = window.getSelection()
    const range = document.createRange()
    if (selection.rangeCount > 0) selection.removeAllRanges()
    const container = this.getSelectedElement()
    const element = container.firstChild || container
    const textLength = element.textContent.length
    const startOffset = select ? 0 : offset
    const endOffset = select && textLength ? textLength - 1 : offset
    range.setStart(element, startOffset)
    range.setEnd(element, endOffset)
    selection.addRange(range)
    this.stashCursorAt(null)
  }

  onCursorChange = () => {
    const { chapters, onCursorTimeChange } = this.props
    const selection = window.getSelection()
    const chapterId = Number(selection.anchorNode.parentNode.dataset.chapter || 0)
    const segmentId = Number(selection.anchorNode.parentNode.dataset.segment || 0)
    const segment = chapters[chapterId] && chapters[chapterId].segments[segmentId]
    const timestamp = segment ? segment.startTime || 0 : 0
    const timestampStart = segment ? segment.startTime || 0 : 0
    const timestampEnd = segment ? segment.endTime || 0 : 0
    onCursorTimeChange(timestamp, chapterId, segmentId, timestampStart, timestampEnd)
  }

  getClosestDataset = (node) => {
    const currentHasDataset = Object.keys(node.dataset || {}).length
    if (currentHasDataset)
      return node.dataset
    return this.getClosestDataset(node.parentNode)
  }

  getSelectedElement = () => {
    if (!isNaN(this.cursor.keyword)) {
      return this.getSelectedKeywordElement()
    }
    const filter = `[data-chapter='${this.cursor.chapter}'][data-segment='${this.cursor.segment}']`
    const fallbackFilter = `[data-chapter='${this.cursor.chapter}']`
    return document.querySelector(filter) || document.querySelector(fallbackFilter).lastChild
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
    const illegalCharacters = e.target.innerText.match(ILLEGAL_CHARS_REGEX) || []
    this.stashCursor(- illegalCharacters.length)
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (e.target.nodeName === 'H2') return this.updateKeyword(chapterId, e.target.innerText)
    chapters[chapterId] = this.parseChapter(e.target, chapterId)
    updateTranscript(chapters).then(this.refreshDiff)
  }

  /** Make sure only text is pasted and override browsers default replacment of new lines */
  // eslint-disable-next-line no-unused-vars
  onPaste = (e, chapterId) => {
    e.preventDefault()
    const text = (e.originalEvent || e).clipboardData.getData('text/plain') || ''
    document.execCommand('insertHTML', false, this.escapeHTML(text))
  }

  escapeHTML = (text) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  onKeyDown = (e, chapterId) => {
    const selection = window.getSelection()
    const segmentId = Number(selection.anchorNode.parentNode.dataset.segment || 0)
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
    const firstSegmentId = Number(selection.anchorNode.parentNode.dataset.segment || 0)
    const lastSegmentId = Number(selection.focusNode.parentNode.dataset.segment || 0)
    const { segments } = chapters[chapterId]
    // Workaround when browser adds <br> element (https://gitlab.inoviagroup.se/patronum/v2t/ui/v2t-list/-/issues/248)
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
      updateTranscript(chapters).then(this.refreshDiff)
    }
  }

  insertNewline = (e, chapterId, segmentId) => {
    const { chapters, updateTranscript } = this.props
    e.preventDefault()
    this.stashCursor(1)
    const range = window.getSelection().getRangeAt(0)
    const selectedLength = range.endOffset - range.startOffset
    const segments = chapters[chapterId].segments
    const charArray = segments[segmentId].words.split('')
    const isLastSegmentChar = segments.length - 1 === segmentId && charArray.length === range.startOffset

    charArray.splice(range.startOffset, selectedLength, `\n${isLastSegmentChar ? '\u200c' : ''}`)
    segments[segmentId].words = charArray.join('')
    chapters[chapterId].segments = segments
    updateTranscript(chapters).then(this.refreshDiff)
  }

  updateKeyword = (id, value) => {
    const { updateTranscript } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    chapters[id].keyword = value.replace(/\r?\n|\r/g, '')
    updateTranscript(chapters).then(this.refreshDiff)
  }

  splitChapter = (e, chapterId, segmentId) => {
    const { updateTranscript, schema } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    e.preventDefault()
    const range = window.getSelection().getRangeAt(0)
    const chapter = chapters[chapterId]
    const segment = chapter.segments[segmentId]
    if (!segment) return
    const nextSegment = { ...segment }
    nextSegment.words = nextSegment.words.slice(range.startOffset).trimStart()
    const usedKeywords = chapters.map(({keyword}) => keyword)
    const nextField = schema.fields.find(({id}) => !usedKeywords.includes(id))
    const nextChapter = {
      keyword: nextField ? nextField.id : '',
      segments: [nextSegment, ...chapters[chapterId].segments.slice(segmentId + 1)]
        .filter(segment => segment.words.length)
    }
    const prevSegment = { ...segment }
    prevSegment.words = prevSegment.words.slice(0, range.startOffset).trimEnd()
    chapters[chapterId].segments = [...chapter.segments.slice(0, segmentId), prevSegment]
      .filter(segment => segment.words.length)
    chapters.splice(chapterId + 1, 0, nextChapter)
    this.stashCursorAt({ chapter: chapterId + 1 })
    updateTranscript(chapters).then(this.refreshDiff)
  }

  handleChapterChange = (e, chapterId, segmentId) => {
    const lastSegmentId = this.props.chapters[chapterId].segments.length - 1
    const textContent = e.target.childNodes[segmentId].textContent
    const range = window.getSelection().getRangeAt(0)
    const isBeginningSelected = segmentId === 0 && range.endOffset === 0
    const isEndingSelected = segmentId === lastSegmentId && range.startOffset === textContent.length
    if (e.keyCode === KEYCODE_ENTER && !e.shiftKey) {
      this.splitChapter(e, chapterId, segmentId)
    } else if (isBeginningSelected && e.keyCode === KEYCODE_BACKSPACE) {
      this.mergeChapter(e, chapterId, chapterId - 1, -1)
    } else if (isEndingSelected && e.keyCode === KEYCODE_DELETE) {
      this.mergeChapter(e, chapterId + 1, chapterId)
    }
  }

  mergeChapter = (e, fromChapterId, toChapterId, cursorOffset) => {
    const { updateTranscript } = this.props
    e.preventDefault()
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (!chapters[fromChapterId] || !chapters[toChapterId]) return null
    this.stashCursor(cursorOffset)
    chapters[toChapterId].segments.push(...chapters[fromChapterId].segments)
    chapters.splice(fromChapterId, 1)
    updateTranscript(chapters).then(this.refreshDiff)
  }

  parseChapter = (target, chapterId) => {
    const { chapters } = this.props
    const segments = Array.from(target.childNodes)
      .reduce((store, child) => {
        const segment = this.parseSegment(child, chapterId)
        return this.reduceSegment(store, segment)
      }, [])
    return { ...chapters[chapterId], segments }
  }

  parseSegment = (child, chapterId) => {
    this.removeInvalidChars(child)
    const { chapters } = this.props
    const segmentId = child.dataset ? Number(child.dataset.segment || 0) : 0
    const segments = chapters[chapterId].segments
    const words = child.textContent
    if (segmentId)
      return { ...segments[segmentId], words }
    return { startTime: 0, endTime: 0, words }
  }

  reduceSegment = (store, segment) => {
    const lastSegment = store[store.length - 1]
    if (lastSegment && lastSegment.words.slice(-1) !== ' ') {
      store[store.length - 1] = {
        ...lastSegment,
        endTime: segment.endTime,
        words: `${lastSegment.words}${segment.words}`
      }
    } else if (segment.words.length) {
      store.push(segment)
    }
    return store
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
      text: segments.map(segment => segment.words).join('')
    })
    const content = chapters.map(mapContentFunction)
    const originalContent = originalChapters.map(mapContentFunction)
    const noContent = [...content, ...originalContent].map(({text}) => text).join('') === ''
    if (noContent) return null

    let deletedContentDiff = []
    originalContent.forEach(({
      id: originalId,
      keyword: originalKeyword,
      text: originalText
    }) => {
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
    })

    const diff = content.reduce(
      (store, chapter) => this.reduceDiff(store, chapter, originalContent), []
    ).concat(deletedContentDiff)

    return diff.map((d, i) => this.parseDiff(i, d, diff)).filter(d => d)
  }

  /**
   * Used as callback function of Array.prototype.reduce()
   */
  reduceDiff = (store, { id, keyword, text }, originalContent) => {
    const { diffInstance } = this.props
    let currentDiff
    originalContent.forEach(originalChapter => {
      if (originalChapter.id === id) {
        // generate difference arrays
        const textDiffs = diffInstance.main(originalChapter.text, text)

        diffInstance.cleanupSemantic(textDiffs)

        let keywordDiff
        if (
          textDiffs.length === 1 && textDiffs[0][0] === 0 &&
          originalChapter.keyword === keyword
        ) {
          // [0]: 0 - hide header, 1 - show header
          keywordDiff = [0, HEADER_TYPE, originalChapter.keyword, keyword]
        } else {
          // add keyword/s if there is any change in text or in keyword
          keywordDiff = [1, HEADER_TYPE, originalChapter.keyword, keyword]
        }
        currentDiff = [
          keywordDiff,
          ...textDiffs
        ]
      }
    })

    if (currentDiff) {
      return [
        ...store,
        ...currentDiff
      ]
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
    if (thisDiff[0] === 1 && thisDiff[1] === HEADER_TYPE) { // header type
      return <HeaderLine key={i} header={thisDiff[2]} updatedHeader={thisDiff[3]} />
    }
    if (thisDiff[0] === -1) {
      return <RemovedLine key={i} diff={thisDiff} prevDiff={prevDiff} nextDiff={nextDiff} />
    }
    if (thisDiff[0] === 1) {
      return <AddedLine key={i} diff={thisDiff} prevDiff={prevDiff} nextDiff={nextDiff} />
    }
    return null
  }

  getRelativeDiffText = (diffArray) => {
    const defaultReturnValue = [1, ' ']
    for(const diff of diffArray){
      if (diff[1] === HEADER_TYPE) {
        return defaultReturnValue
      } else if(diff[0] === 0) {
        return diff
      }
    }
    return defaultReturnValue
  }

  setKeyword = (keywordValue, chapterId) => {
    const { schema } = this.props
    const keywordId = schema.fields.find(field => field.name === keywordValue).id
    this.updateKeyword(chapterId, keywordId)
  }

  render() {
    const { currentTime, chapters, onSelect, noDiff, schema } = this.props
    const { diff, error } = this.state
    const [preferences] = this.context
    if (!chapters) return null
    return (
      <>
        <EditableChapters
          chapters={chapters}
          inputRef={this.inputRef}
          currentTime={currentTime}
          onChange={this.onChange}
          onPaste={this.onPaste}
          onKeyDown={this.onKeyDown}
          onSelect={onSelect}
          onCursorChange={this.onCursorChange}
          error={error}
          context={preferences}
          schema={schema}
          setKeyword={this.setKeyword}
        />
        {
          !noDiff && <FullDiff diff={diff} />
        }
      </>
    )
  }
}

const EditableChapters = ({ chapters, inputRef, ...editableChapterProps }) => {
  if (!inputRef) return null
  const editors = chapters.map((chapter, i) => (
    <EditableChapter
      key={i}
      chapterId={i}
      keyword={chapter.keyword}
      segments={chapter.segments}
      {...{ ...editableChapterProps }}
    />
  ))
  return (
    <div ref={inputRef}>
      {editors}
    </div>
  )
}

EditableChapters.propTypes = {
  chapters: PropTypes.array.isRequired,
  inputRef: PropTypes.any
}

const EditableChapter = ({ chapterId, keyword, schema, setKeyword, ...chunkProps }) => {
  const sectionHeaders = schema.fields ? schema.fields.map(({name}) => name) : []
  const field = schema.fields ? schema.fields.find(({id}) => id === keyword) : null
  const sectionHeader = field ? field.name : ''
  return (
    <EuiFormRow style={{ maxWidth: '100%' }}>
      <>
        <SectionHeader
          isVisible
          keywords={sectionHeaders}
          selectedHeader={sectionHeader}
          updateKey={setKeyword}
          chapterId={chapterId}
        />
        <Chunks
          chapterId={chapterId}
          {...{ ...chunkProps }}
        />
      </>
    </EuiFormRow>
  )
}

EditableChapter.propTypes = {
  chapterId: PropTypes.number,
  keyword: PropTypes.string,
  schema: PropTypes.object.isRequired,
  setKeyword: PropTypes.func.isRequired
}

const Chunks = ({ segments, currentTime, context, chapterId, onChange, onPaste, onKeyDown, onSelect, onCursorChange }) => {
  const chunks = segments.map((props, i) => <Chunk key={i} {...{ ...props, chapterId, i, currentTime, context }} />)
  return (
    <EuiText>
      <pre>
        <code
          className="editorTextArea"
          key={JSON.stringify(segments)}
          onInput={e => onChange(e, chapterId)}
          onPaste={e => onPaste(e, chapterId)}
          onKeyDown={e => onKeyDown(e, chapterId)}
          onKeyUp={onCursorChange}
          onClick={onCursorChange}
          onSelect={onSelect}
          contentEditable
          suppressContentEditableWarning
          data-chapter={chapterId}
          >
          {chunks.length ? chunks : <FallbackChunk chapterId={chapterId} />}
        </code>
      </pre>
    </EuiText>
  )
}

Chunks.propTypes = {
  segments: PropTypes.array,
  currentTime: PropTypes.number,
  context: PropTypes.object,
  chapterId: PropTypes.number,
  onChange: PropTypes.func,
  onPaste: PropTypes.func,
  onKeyDown: PropTypes.func,
  onSelect: PropTypes.func,
  onCursorChange: PropTypes.func
}

const Chunk = ({ words, startTime, endTime, chapterId, i, currentTime, context }) => {
  let style
  const current = currentTime > startTime && currentTime <= endTime
  if (context) {
    style = current ? {
      fontWeight: 'bold',
      backgroundColor: '#FFFF00',
      fontSize: context.currentFontSize
    } : { fontSize: context.currentFontSize }
  } else {
    style = current ? { fontWeight: 'bold', backgroundColor: '#FFFF00' } : {}
  }
  return (
    <span style={style} className="editorBody" data-chapter={chapterId} data-segment={i}>
      {words}
    </span>
  )
}

Chunk.propTypes = {
  words: PropTypes.any,
  startTime: PropTypes.number,
  endTime: PropTypes.number,
  chapterId: PropTypes.number,
  i: PropTypes.number,
  currentTime: PropTypes.number,
  context: PropTypes.object
}

const FallbackChunk = ({ chapterId }) => (
  <Chunk words="" startTime={0} endTime={0} chapterId={chapterId} i={0} currentTime={0} />
)

FallbackChunk.propTypes = {
  chapterId: PropTypes.number
}

const FullDiff = ({ diff }) => {
  if (diff === null || diff.length === 0) return null
  return (
    <>
      <code className="fullDiffArea">{diff}</code>
      <EuiSpacer size="xl" />
    </>
  )
}

FullDiff.propTypes = {
  diff: PropTypes.array
}

const RemovedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="danger">- </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="danger" style={{ background: '#BD271E30' }}>{diff[1]}</EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)

RemovedLine.propTypes = {
  diff: PropTypes.array,
  prevDiff: PropTypes.array,
  nextDiff: PropTypes.array
}

const AddedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="secondary">+ </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="secondary" style={{ background: '#017D7330' }}>{diff[1]}</EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)

AddedLine.propTypes = {
  diff: PropTypes.array,
  prevDiff: PropTypes.array,
  nextDiff: PropTypes.array
}

const HeaderLine = ({ header, updatedHeader }) => {
  if (header === updatedHeader) {
    return (
      <EuiText size="m"><b>{ header }</b></EuiText>
    )
  } else {
    return (
      <EuiText size="m">
        {
          header &&
          <b><EuiTextColor color="danger" style={{ background: '#BD271E30' }}>
            { header }
          </EuiTextColor> </b>
        }
        {
          updatedHeader &&
          <b><EuiTextColor color="secondary" style={{ background: '#017D7330' }}>
            { updatedHeader }
          </EuiTextColor></b>
        }
      </EuiText>
    )
  }
}

HeaderLine.propTypes = {
  header: PropTypes.string,
  updatedHeader: PropTypes.string
}
