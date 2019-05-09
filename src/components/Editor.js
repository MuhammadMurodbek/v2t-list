import React, { Component, Fragment } from 'react'
import Diff from 'text-diff'

import {
  EuiFlexGroup, EuiFlexItem, EuiText, EuiTextColor
} from '@elastic/eui'

const NEW_KEYWORD = 'New Chapter'
const KEYCODE_ENTER = 13
const KEYCODE_BACKSPACE = 8
const KEYCODE_DELETE = 46
const ERROR_NOT_FOUND = 8

export default class Editor extends Component {
  static defaultProps = {
    diffInstance: new Diff(),
    transcript: null,
    originalChapters: null,
    chapters: null,
    currentTime: 0,
    keywords: []
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
    const { originalChapters } = this.props
    this.updateCursor()

    if (prevProps.originalChapters !== originalChapters) {
      this.initChapters()
    }
  }

  initChapters = () => {
    const { originalChapters, updateTranscript } = this.props
    const chapters = originalChapters
    updateTranscript(chapters)
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
    const { chapters } = this.props
    const range = window.getSelection().getRangeAt(0)
    const node = range.startContainer
    const dataset = this.getClosestDataset(node)
    this.cursor = {
      keyword: Number(dataset.keyword),
      chapter: Number(dataset.chapter),
      segment: Number(dataset.segment),
      offset: range.startOffset + offset
    }
    this.arrangeCursor()
  }

  popCursor = () => {
    const selection = window.getSelection()
    const range = document.createRange()
    if (selection.rangeCount > 0) selection.removeAllRanges()
    const container = this.getSelectedElement()
    range.setStart(container.firstChild || container, this.cursor.offset)
    range.setEnd(container.firstChild || container, this.cursor.offset)
    selection.addRange(range)
    this.cursor = null
  }

  getClosestDataset = (node, offset) => {
    return Object.keys(node.dataset || {}).length ? node.dataset : this.getClosestDataset(node.parentNode)
  }

  getSelectedElement = () => {
    if (!isNaN(this.cursor.keyword))
      return this.getSelectedKeywordElement()
    const filter = `[data-chapter='${this.cursor.chapter}'][data-segment='${this.cursor.segment}']`
    const fallbackFilter = `[data-chapter='${this.cursor.chapter-1}']`
    return document.querySelector(filter) || document.querySelector(fallbackFilter).lastChild
  }

  getSelectedKeywordElement = () => {
    const h2 = document.querySelector(`[data-keyword='${this.cursor.keyword}']`)
    return h2.firstChild || h2
  }

  arrangeCursor = () => {
    const { chapters } = this.props
    const cursor = this.cursor
    if (!isNaN(cursor.keyword) || cursor.offset >= 0) return
    cursor.segment--
    if (cursor.segment < 0) {
      cursor.chapter--
      cursor.segment = chapters[cursor.chapter].segments.length -1
    }
    cursor.offset = chapters[cursor.chapter].segments[cursor.segment].words.length
    this.cursor = cursor
  }

  onChange = (e, chapterId) => {
    const { updateTranscript } = this.props
    this.stashCursor()
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (e.target.nodeName === 'H2') return this.updateKeyword(chapterId, e.target.innerText)
    chapters[chapterId] = this.parseChapter(e.target, chapterId)
    const diff = this.getDiff(chapters)
    this.setState({ diff })
    updateTranscript(chapters)
  }

  onPaste = (e, chapterId) => {
    const original = e.target.innerText
    const insert = e.clipboardData.getData('Text')
    const selection = window.getSelection()
    const startOffset = selection.getRangeAt(0).startOffset
    const endOffset = selection.getRangeAt(0).endOffset
    const words = `${original.slice(0, startOffset)}${insert}${original.slice(endOffset)}`
    e.preventDefault()
    if (e.target.nodeName === 'H2') return this.updateKeyword(chapterId, words)
    const i = e.target.dataset.segment
    this.onChangeSegment(e, chapterId, i, words)
  }

  onChangeSegment = (e, chapterId, segmentId, words) => {
    const { updateTranscript } = this.props
    this.stashCursor(words.length - e.target.innerText.length)
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    chapters[chapterId].segments[segmentId].words = words
    const diff = this.getDiff(chapters)
    this.setState({ diff })
    updateTranscript(chapters)
  }

   onKeyDown = (e, chapterId) => {
     const selection = window.getSelection()
     const segmentId = Number(selection.anchorNode.parentNode.dataset.segment || 0)
     if (e.keyCode === KEYCODE_ENTER && !e.shiftKey) {
       this.splitChapter(e, chapterId, segmentId)
     }
     if (e.keyCode === KEYCODE_BACKSPACE) {
       this.mergeWithPreviousChapter(e, chapterId, segmentId)
     }
     if (e.keyCode === KEYCODE_DELETE) {
       this.mergeWithNextChapter(e, chapterId, segmentId)
     }
   }

  updateKeyword = (id, value) => {
    const { updateTranscript } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    chapters[id].keyword = value.replace(/\r?\n|\r/g, '')
    updateTranscript(chapters)
  }

  splitChapter = (e, chapterId, segmentId) => {
    const { updateTranscript } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    e.preventDefault()
    const range = window.getSelection().getRangeAt(0)
    const chapter = chapters[chapterId]
    const segment = chapter.segments[segmentId]
    const nextSegment = {...segment}
    nextSegment.words = nextSegment.words.slice(range.startOffset).trimStart()
    const nextChapter = {
      keyword: NEW_KEYWORD,
      segments: [nextSegment, ...chapters[chapterId].segments.slice(segmentId+1)]
        .filter(segment => segment.words.length)
    }
    const prevSegment = {...segment}
    prevSegment.words = prevSegment.words.slice(0, range.startOffset).trimEnd()
    chapters[chapterId].segments = [...chapter.segments.slice(0, segmentId), prevSegment]
      .filter(segment => segment.words.length)
    chapters.splice(chapterId+1, 0, nextChapter)
    updateTranscript(chapters)
  }

  mergeWithPreviousChapter = (e, chapterId, segmentId) => {
    const selection = window.getSelection()
    const beginningSelected = segmentId === 0 && selection.getRangeAt(0).endOffset === 0
    if (beginningSelected) {
      this.mergeChapter(e, chapterId, chapterId - 1, -1)
    }
  }

  mergeWithNextChapter = (e, chapterId, segmentId) => {
    const { chapters } = this.props
    const selection = window.getSelection()
    const chapter = chapters[chapterId]
    const isLastSegment = chapter.segments.length -1 === segmentId
    const wordsLength = chapter.segments[segmentId].words.length
    const endingSelected = isLastSegment && wordsLength === selection.getRangeAt(0).startOffset
    if (endingSelected)
      this.mergeChapter(e, chapterId+1, chapterId)
  }

  mergeChapter = (e, fromChapterId, toChapterId, cursorOffset) => {
    const { updateTranscript } = this.props
    const chapters = JSON.parse(JSON.stringify(this.props.chapters))
    if (!chapters[fromChapterId] || !chapters[toChapterId]) return null
    e.preventDefault()
    this.stashCursor(cursorOffset)
    const toSegments = chapters[toChapterId].segments
    const lastToSegment = toSegments[toSegments.length-1]
    chapters[toChapterId].segments[toSegments.length-1].words = `${lastToSegment.words.trimEnd()} `
    chapters[toChapterId].segments.push(...chapters[fromChapterId].segments)
    chapters.splice(fromChapterId, 1)
    updateTranscript(chapters)
  }

  parseChapter = (target, chapterId) => {
    const { chapters } = this.props
    const segments = Array.from(target.childNodes).map(child => this.parseSegment(child, chapterId))
      .filter(segment => segment.words.length)
    return { ...chapters[chapterId], segments }
  }

  parseSegment = (child, chapterId) => {
    const { chapters } = this.props
    const segmentId = child.dataset ? child.dataset.segment : null
    const segments = chapters[chapterId].segments
    const words = child.textContent
    if (segmentId)
      return { ...segments[segmentId], words }
    return { startTime: 0, endTime: 0, words }
  }

  getDiff = (chapters) => {
    const { diffInstance, originalChapters } = this.props
    if (!this.inputRef || !this.inputRef.current) return null
    const content = chapters.map(transcript => transcript.segments.map(segment => segment.words).join('')).join('')
    const originalText = originalChapters.map(transcript => transcript.segments.map(segment => segment.words).join('')).join('')
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


  validate = () => {
    const { keywords, chapters } = this.props
    const invalidChapters = chapters.filter(chapter => !keywords.includes(chapter.keyword.toLowerCase()))
    const error = invalidChapters.map(({ keyword }) => keyword)
    this.setState({ error }, ()=> {
      this.props.validateTranscript(error)
    })
    return !error.length
  }


  render() {
    const { currentTime, chapters, onSelect } = this.props
    const { diff, error } = this.state
    if (!chapters) return null
    return (
      <EuiText size="s">
        <EditableChapters
          chapters={chapters}
          inputRef={this.inputRef}
          currentTime={currentTime}
          onChange={this.onChange}
          validate={this.validate}
          onKeyDown={this.onKeyDown}
          onSelect={this.onSelect}
          onPaste={this.onPaste}
          error={error}
        />
        <EuiFlexGroup>
          <EuiFlexItem>
            <FullDiff diff={diff} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiText>
    )
  }
}

const EditableChapters = ({ chapters, inputRef, currentTime, onChange, validate, onKeyDown, onSelect, onPaste, error }) => {
  if (!inputRef) return null
  const editors = chapters.map((chapter, i) => (
    <EditableChapter
      key={i}
      chapterId={i}
      keyword={chapter.keyword}
      segments={chapter.segments}
      currentTime={currentTime}
      onChange={onChange}
      validate={validate}
      onKeyDown={onKeyDown}
      onSelect={onSelect}
      onPaste={onPaste}
      error={error}
    />
  ))
  return (
    <div ref={inputRef}>
      {editors}
    </div>
  )
}

const EditableChapter = ({ chapterId, keyword, segments, onChange, validate, onKeyDown, currentTime, onSelect, onPaste, error }) => {
  const onFocus = () => {
    if (keyword === NEW_KEYWORD)
      setTimeout(() => document.execCommand('selectAll',false,null),0)
  }
  return (
    <Fragment>
      <h2
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
      </h2>
      <Chunks
        segments={segments}
        currentTime={currentTime}
        chapterId={chapterId}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        onPaste={onPaste}
      />
    </Fragment>
  )
}

const Chunks = ({ segments, currentTime, chapterId, onChange, onKeyDown, onSelect, onPaste }) => {
  const chunks = segments.map((props, i) => <Chunk key={i} {...{...props, chapterId, i, currentTime}} />)
  return (
    <pre>
      <code
        key={segments.toString()}
        onInput={e => onChange(e, chapterId)}
        onKeyDown={e => onKeyDown(e, chapterId)}
        onSelect={onSelect}
        onPaste={e => onPaste(e, chapterId)}
        contentEditable
        suppressContentEditableWarning
        data-chapter={chapterId}
      >
        {chunks.length ? chunks : <FallbackChunk chapterId={chapterId} />}
      </code>
    </pre>
  )
}

const Chunk = ({ words, startTime, endTime, chapterId, i, currentTime }) => {
  const current = currentTime > startTime && currentTime <= endTime
  const style = current ? { fontWeight: 'bold', backgroundColor: '#FFFF00' } : {}
  return (
    <span style={style} data-chapter={chapterId} data-segment={i}>
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
