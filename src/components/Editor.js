import React, { Component, Fragment } from 'react'
import Diff from 'text-diff'

import {
  EuiFlexGroup, EuiFlexItem, EuiText, EuiTextColor
} from '@elastic/eui'

import { PreferenceContext } from './PreferencesProvider'
import SectionHeader from '../components/SectionHeader'
import '../styles/editor.css'

const NEW_KEYWORD = 'New Chapter'
const KEYCODE_ENTER = 13
const KEYCODE_BACKSPACE = 8
const KEYCODE_DELETE = 46

const ILLEGAL_CHARS_REGEX = /˜/g

export default class Editor extends Component {
  static contextType = PreferenceContext

  static defaultProps = {
    diffInstance: new Diff(),
    transcript: null,
    originalChapters: null,
    chapters: null,
    currentTime: 0,
    initialCursor: 0
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
    const { initialCursor, originalChapters } = this.props
    if (initialCursor && prevProps.initialCursor !== initialCursor)
      this.setCursor(initialCursor, true)
    else
      this.updateCursor()

    if (prevProps.originalChapters !== originalChapters) {
      this.initChapters()
    }
  }

  initChapters = () => {
    const { originalChapters, updateTranscript } = this.props
    if (originalChapters) {
      const chapters = originalChapters.map((chapter) => {
        const segments = chapter.segments.reduce(this.reduceSegment, [])
        return { ...chapter, segments }
      })
      updateTranscript(chapters)
    }
  }

  setCursor = (timestamp, select) => {
    const { chapters } = this.props
    const cursor = chapters.reduce((store, {segments}, chapter) => {
      const segment = segments.findIndex(({startTime, endTime}) => {
        //find segment within timestamp or find closest to startTime
        return (startTime <= timestamp && endTime >= timestamp)
          || (startTime > timestamp && startTime < store.startTime)
      })
      return segment >= 0 ? { chapter, segment, offset: 0, startTime: segments[segment].startTime, select } : store
    }, { chapter: 0, segment: 0, offset: 0, startTime: Number.MAX_SAFE_INTEGER, select })
    this.cursor = cursor
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
    const siblingOffset = node.previousSibling ? node.previousSibling.data.length : 0
    const dataset = this.getClosestDataset(node)
    this.cursor = {
      keyword: Number(dataset.keyword),
      chapter: Number(dataset.chapter),
      segment: Number(dataset.segment || 0),
      offset: range.startOffset + siblingOffset + offset
    }
    if (isNaN(this.cursor.keyword) && this.cursor.offset < 0)
      this.alignCursorToPreviousSegment()
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
    this.cursor = null
  }

  onCursorChange = () => {
    const { chapters, onCursorTimeChange } = this.props
    const selection = window.getSelection()
    const chapterId = Number(selection.anchorNode.parentNode.dataset.chapter || 0)
    const segmentId = Number(selection.anchorNode.parentNode.dataset.segment || 0)
    const segment = chapters[chapterId] && chapters[chapterId].segments[segmentId]
    const timestamp = segment ? segment.startTime || 0 : 0
    onCursorTimeChange(timestamp)
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
    this.cursor = cursor
  }

  onChange = (e, chapterId) => {
    const { updateTranscript } = this.props
    const illegalCharacters = e.target.innerText.match(ILLEGAL_CHARS_REGEX) || []
    this.stashCursor(- illegalCharacters.length)
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (e.target.nodeName === 'H2') return this.updateKeyword(chapterId, e.target.innerText)
    chapters[chapterId] = this.parseChapter(e.target, chapterId)
    const diff = this.getDiff(chapters)
    this.setState({ diff })
    updateTranscript(chapters)
  }

  /** Make sure only text is pasted and override browsers default replacment of new lines */
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
    this.handleChapterChange(e, chapterId, segmentId)
  }

  insertNewline = (e, chapterId, segmentId) => {
    const { chapters, updateTranscript } = this.props
    e.preventDefault()
    this.stashCursor(1)
    const range = window.getSelection().getRangeAt(0)
    const selectedLength = range.endOffset - range.startOffset
    const segments = chapters[chapterId].segments
    const charArray = segments[segmentId].words.split('')
    charArray.splice(range.startOffset, selectedLength, '\n')
    segments[segmentId].words = charArray.join('')
    chapters[chapterId].segments = segments
    updateTranscript(chapters)
  }

  updateKeyword = (id, value) => {
    const { updateTranscript } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    chapters[id].keyword = value.replace(/\r?\n|\r/g, '')
    updateTranscript(chapters)
  }

  splitChapter = (e, chapterId, segmentId) => {
    const { updateTranscript, sectionHeaders } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    e.preventDefault()
    const range = window.getSelection().getRangeAt(0)
    const chapter = chapters[chapterId]
    const segment = chapter.segments[segmentId]
    if (!segment) return
    const nextSegment = { ...segment }
    nextSegment.words = nextSegment.words.slice(range.startOffset).trimStart()
    // const nextChapter = {
    //   keyword: NEW_KEYWORD,
    //   segments: [nextSegment, ...chapters[chapterId].segments.slice(segmentId + 1)]
    //     .filter(segment => segment.words.length)
    // }
    const nextChapter = {
      keyword: sectionHeaders[sectionHeaders.length-1],
      segments: [nextSegment, ...chapters[chapterId].segments.slice(segmentId + 1)]
        .filter(segment => segment.words.length)
    }
    const prevSegment = { ...segment }
    prevSegment.words = prevSegment.words.slice(0, range.startOffset).trimEnd()
    chapters[chapterId].segments = [...chapter.segments.slice(0, segmentId), prevSegment]
      .filter(segment => segment.words.length)
    chapters.splice(chapterId + 1, 0, nextChapter)
    updateTranscript(chapters)
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
      this.mergeChapter(e, chapterId, chapterId -1, -1)
    } else if (isEndingSelected && e.keyCode === KEYCODE_DELETE) {
      this.mergeChapter(e, chapterId +1, chapterId)
    }
  }

  mergeChapter = (e, fromChapterId, toChapterId, cursorOffset) => {
    const { updateTranscript } = this.props
    e.preventDefault()
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (!chapters[fromChapterId] || !chapters[toChapterId]) return null
    this.stashCursor(cursorOffset)
    const toSegments = chapters[toChapterId].segments
    const lastToSegment = toSegments[toSegments.length - 1]
    if (lastToSegment)
      chapters[toChapterId].segments[toSegments.length - 1].words = `${lastToSegment.words.trimEnd()} `
    chapters[toChapterId].segments.push(...chapters[fromChapterId].segments)
    chapters.splice(fromChapterId, 1)
    updateTranscript(chapters)
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
    const segmentId = child.dataset ? child.dataset.segment : null
    const segments = chapters[chapterId].segments
    const words = child.textContent
    if (segmentId)
      return { ...segments[segmentId], words }
    return { startTime: 0, endTime: 0, words }
  }

  reduceSegment = (store, segment) => {
    const lastSegment = store[store.length -1]
    if (lastSegment && lastSegment.words.slice(-1) !== ' ') {
      lastSegment.words += segment.words
      lastSegment.endTime = segment.endTime
      store[store.length -1] = lastSegment
    } else if (segment.words.length) {
      store.push(segment)
    }
    return store
  }

  removeInvalidChars = (child) => {
    child.textContent = child.textContent.replace(ILLEGAL_CHARS_REGEX, '')
  }

  getDiff = (chapters) => {
    const { diffInstance, headerUpdatedChapters, originalChapters } = this.props
    if (!this.inputRef || !this.inputRef.current) return null
    const content = chapters.map(transcript => transcript.segments.map(segment => segment.words).join('')).join('')
    let originalText
    if( headerUpdatedChapters.length > 0 ) {
      originalText = headerUpdatedChapters.map(transcript => transcript.segments.map(segment => segment.words).join('')).join('')
    } else {
      originalText = originalChapters.map(transcript => transcript.segments.map(segment => segment.words).join('')).join('')
    }
    const diff = diffInstance.main(originalText, content)
    diffInstance.cleanupSemantic(diff)
    return diff.map((d, i) => this.parseDiff(i, d, diff)).filter(d => d)
  }

  parseDiff = (i, thisDiff, diff) => {
    const prevDiff = diff.slice(0, i).reverse().find(d => d[0] === 0) || [1, ' ']
    const nextDiff = diff.slice(i).find(d => d[0] === 0) || [1, ' ']
    if (thisDiff[0] === -1) {
      return <RemovedLine key={i} diff={thisDiff} prevDiff={prevDiff} nextDiff={nextDiff} />
    }
    if (thisDiff[0] === 1) {
      return <AddedLine key={i} diff={thisDiff} prevDiff={prevDiff} nextDiff={nextDiff} />
    }
    return null
  }

  setKeyword = (keywordValue, chapterId) => {
    this.updateKeyword(chapterId, keywordValue)
  }

  render() {
    const { currentTime, chapters, onSelect, isDiffVisible, sectionHeaders } = this.props
    console.log("Section headers", chapters)
    const { diff, error } = this.state
    const [preferences] = this.context
    if (!chapters) return null
    return (
      <EuiText size="s">
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
          sectionHeaders={sectionHeaders}
          setKeyword={this.setKeyword}
        />
        <EuiFlexGroup style={{ display: isDiffVisible ? 'flex' : 'none' }}>
          <EuiFlexItem>
            <FullDiff diff={diff} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiText>
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

const EditableChapter = ({ chapterId, keyword, sectionHeaders, setKeyword, ...chunkProps }) => {
  // const onFocus = () => {
  // if (keyword === NEW_KEYWORD)
  //    setTimeout(() => document.execCommand('selectAll', false, null), 0)
  // }
  return (
    <Fragment>
      {/* <h2
        key={keyword}
        onInput={e => onChange(e, chapterId)}
        onKeyDown={e => { if (e.keyCode === 13) e.preventDefault() }}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onBlur={validate}
        data-keyword={chapterId}
      >
        <EuiTextColor color={error.includes(keyword) ? 'danger' : 'default'}>
          {keyword}
        </EuiTextColor>
      </h2> */}
      <SectionHeader
        isVisible
        keywords={sectionHeaders}
        selectedHeader={keyword}
        updateKey={setKeyword}
        chapterId={chapterId}
      />
      <Chunks
        chapterId={chapterId}
        {...{ ...chunkProps }}
      />
    </Fragment>
  )
}

const Chunks = ({ segments, currentTime, context, chapterId, onChange, onPaste, onKeyDown, onSelect, onCursorChange }) => {
  const chunks = segments.map((props, i) => <Chunk key={i} {...{ ...props, chapterId, i, currentTime, context }} />)
  return (
    <pre>
      <code
        style={{minHeight: '20px'}}
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
  )
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

const FallbackChunk = ({ chapterId }) => (
  <Chunk words='' startTime={0} endTime={0} chapterId={chapterId} i={0} currentTime={0} />
)

const FullDiff = ({ diff }) => {
  if (diff === null || diff.length === 0) return null
  return <pre><code>{diff}</code></pre>
}

const RemovedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="danger">- </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="danger" style={{ background: '#BD271E30' }}>{diff[1]}</EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)

const AddedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="secondary">+ </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="secondary" style={{ background: '#017D7330' }}>{diff[1]}</EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)
