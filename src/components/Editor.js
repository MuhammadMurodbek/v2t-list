import React, { Component, Fragment } from 'react'
import axios from 'axios'
import Diff from 'text-diff'

import {
  EuiFlexGroup, EuiFlexItem, EuiText, EuiTextColor, EuiButton
} from '@elastic/eui'

const NEW_KEYWORD = 'New Chapter'

export default class Editor extends Component {
  static defaultProps = {
    diffInstance: new Diff(),
    transcript: null,
    originalChapters: null,
    currentTime: 0,
    keywords: []
  }

  state = {
    chapters: null,
    diff: null,
    error: []
  }

  componentDidMount() {
    this.inputRef = React.createRef()
    this.initChapters()
  }

  componentDidUpdate(prevProps) {
    const { originalChapters } = this.props
    if (this.inputRef && this.inputRef.current)
      this.updateCursor()
    if (prevProps.originalChapters !== originalChapters)
      this.initChapters()
  }

  initChapters = () => {
    const { originalChapters } = this.props
    const chapters = originalChapters
    this.setState({ chapters })
  }

  updateCursor = () => {
    if (this.savedRange)
      return this.popCursor()
    const newKeyword = Object.values(this.inputRef.current.getElementsByTagName('h2'))
      .find(element => element.innerText === NEW_KEYWORD)
    if (newKeyword)
      newKeyword.focus()
  }

  stashCursor = () => {
    this.savedRange = window.getSelection().getRangeAt(0) //.cloneRange() not working?
    this.savedRangeOffset = this.savedRange.startOffset
  }

  popCursor = () => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) selection.removeAllRanges()
    this.savedRange.setStart(this.savedRange.startContainer, this.savedRangeOffset)
    selection.addRange(this.savedRange)
    this.savedRange = this.savedRangeOffset = null
  }

  onChange = (e, id) => {
    this.stashCursor()
    if (e.target.nodeName === 'H2') return this.updateKeyword(id, e.target.innerText)
    const chapters = JSON.parse(JSON.stringify(this.state.chapters))
    chapters[id].segments = this.estimateSegmentsFromNode(id, e.target.innerText)
    const diff = this.getDiff()
    this.setState({ chapters, diff })
  }

   onKeyDown = (e, chapterId) => {
    if (e.keyCode === 13 && !e.shiftKey)
      this.splitChapter(e, chapterId)
    if (e.keyCode === 8)
      this.mergeWithPreviousChapter(e, chapterId)
    if (e.keyCode === 46)
      this.mergeWithNextChapter(e, chapterId)
  }

  updateKeyword = (id, value) => {
    const chapters = JSON.parse(JSON.stringify(this.state.chapters))
    chapters[id].keyword = value.replace(/\r?\n|\r/g, '')
    this.setState({ chapters })
  }

  splitChapter = (e, chapterId) => {
    e.preventDefault()
    const selection = window.getSelection()
    const nextText = this.nextText(selection)
    const chapter = {
      keyword: NEW_KEYWORD,
      segments: this.estimateSegmentsFromNode(chapterId, nextText)
    }
    const chapters = JSON.parse(JSON.stringify(this.state.chapters))
    const prevText = this.prevText(selection)
    chapters[chapterId].segments = this.estimateSegmentsFromNode(chapterId, prevText)
    chapters.splice(chapterId+1, 0, chapter)
    this.setState({ chapters })
  }

  mergeWithPreviousChapter = (e, chapterId) => {
    const selection = window.getSelection()
    const beginningSelected = !this.prevText(selection).length
    if (beginningSelected)
      this.mergeChapter(e, chapterId, chapterId-1)
  }

  mergeWithNextChapter = (e, chapterId) => {
    const selection = window.getSelection()
    const endingSelected = !this.nextText(selection).length
    if (endingSelected)
      this.mergeChapter(e, chapterId+1, chapterId)
  }

  mergeChapter = (e, fromChapterId, toChapterId) => {
    const chapters = JSON.parse(JSON.stringify(this.state.chapters))
    if (!chapters[fromChapterId] || !chapters[toChapterId]) return null
    e.preventDefault()
    chapters[toChapterId].segments.push(...chapters[fromChapterId].segments)
    chapters.splice(fromChapterId, 1)
    this.setState({ chapters })
  }

  estimateSegmentsFromNode = (chapterId, text) => {
    const { diffInstance } = this.props
    const { chapters } = this.state
    const original = chapters[chapterId].segments.map(s => s.words).join('')
    let consumableDiff = diffInstance.main(original, text)
    diffInstance.cleanupSemantic(consumableDiff)
    const postProcess = []
    const segments = chapters[chapterId].segments.map((segment, i) => {
      const words = segment.words.split('').map((char, j) => {
        switch (consumableDiff[0][0]) {
          case -1:
            if (consumableDiff[0][1].length < 2)
              consumableDiff.shift()
            else
              consumableDiff[0][1] = consumableDiff[0][1].slice(1)
            return ''
          case 1:
            const added = consumableDiff.shift()[1]
            const remain = consumableDiff[0][1].slice(0,1)
            consumableDiff[0][1] = consumableDiff[0][1].slice(1)
            if (i === 0 || j > 0)
              return `${added}${remain}`
            postProcess.push({id: i-1, added})
            return remain
          default:
            if (consumableDiff[0][1].length < 2)
              return consumableDiff.shift()[1]
            const same = consumableDiff[0][1].slice(0,1)
            consumableDiff[0][1] = consumableDiff[0][1].slice(1)
            return same
        }
      }).join('')
      return { ...segment, words }
    }).filter(segment => segment.words.length)
    postProcess.forEach(({ id, added }) => {
      segments[id].words += added
    })
    return segments
  }

  prevText = (selection) => {
    const end = selection.anchorNode.textContent.slice(0, selection.anchorOffset)
    return this.prevSiblingsText(selection.anchorNode.parentNode) + end
  }

  prevSiblingsText = (parentNode) => {
    if (!parentNode.previousSibling) return ''
    return this.prevSiblingsText(parentNode.previousSibling)
      + Array.from(parentNode.previousSibling.childNodes).reduce((text, child) => text + child.textContent, '')
  }

  nextText = (selection) => {
    const start = selection.anchorNode.textContent.slice(selection.anchorOffset)
    return start + this.nextSiblingsText(selection.anchorNode.parentNode)
  }

  nextSiblingsText = (parentNode) => {
    if (!parentNode.nextSibling) return ''
    return Array.from(parentNode.nextSibling.childNodes).reduce((text, child) => text + child.textContent, '')
      + this.nextSiblingsText(parentNode.nextSibling)
  }

  getAllContent = () => {
    return Object.values(this.inputRef.current.getElementsByTagName('pre'))
      .map(element => element.innerText).join('')
  }

  getDiff = () => {
    const { diffInstance, originalChapters } = this.props
    if (!this.inputRef || !this.inputRef.current) return null
    const content = this.getAllContent()
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

  finalize = async () => {
    this.save()
    // const {id} = this.props
    // const { chapters } = this.state
    // const queryString = `/api/v1/transcription/${id}`
    // axios.put(queryString,
    //   {
    //     tags: [],
    //     transcriptions: chapters
    //   })
    //   .then((response) => {
    //     alert('Transcript is updated')
    //   })
    //   .catch((error) => {
    //     console.log(error)
    //   })
  }

  save = () => {
    const { keywords } = this.props
    const { chapters } = this.state
    const invalidChapters = chapters.filter(chapter => !keywords.includes(chapter.keyword.toLowerCase()))
    const error = invalidChapters.map(({ keyword }) => keyword)
    this.setState({ error })
    //TODO: post state
    return !error.length
  }

  cancel = () => {
    // empty blocks
  }

  render() {
    const { currentTime } = this.props
    const { chapters, diff, error } = this.state
    if (!chapters) return null
    return (
      <EuiText size="s">
        <EditableChapters
          chapters={chapters}
          inputRef={this.inputRef}
          currentTime={currentTime}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          onSelect={this.props.onSelect}
          error={error}
        />
        <EuiFlexGroup>
          <EuiFlexItem>
            <FullDiff diff={diff} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="secondary" onClick={this.finalize}>Finalize</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton color="secondary" onClick={this.save}>Save Changes</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill color="danger" onClick={this.cancel}>Cancel</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiText>
    )
  }
}

const EditableChapters = ({ chapters, inputRef, currentTime, onChange, onKeyDown, onSelect, error }) => {
  if (!inputRef) return null
  const editors = chapters.map((chapter, i) => (
    <EditableChapter
      key={i}
      chapterId={i}
      keyword={chapter.keyword}
      subtitles={chapter.segments}
      currentTime={currentTime}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onSelect={onSelect}
      error={error}
    />
  ))
  return (
    <div ref={inputRef}>
      {editors}
    </div>
  )
}

const EditableChapter = ({ chapterId, keyword, subtitles, onChange, onKeyDown, currentTime, onSelect, error }) => (
  <Fragment>
    <h2
      onInput={e => onChange(e, chapterId)}
      onKeyDown={e => { if (e.keyCode === 13) e.preventDefault() }}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setTimeout(() => document.execCommand('selectAll',false,null),0)}
    >
      <EuiTextColor color={error.includes(keyword) ? 'danger' : 'default'}>
        {keyword}
      </EuiTextColor>
    </h2>
    <pre>
      <code
        onInput={e => onChange(e, chapterId)}
        onKeyDown={e => onKeyDown(e, chapterId)}
        contentEditable
        suppressContentEditableWarning
        onSelect={onSelect}
      >
        <Chunks subtitles={subtitles} currentTime={currentTime} />
      </code>
    </pre>
  </Fragment>
)

const Chunks = ({ subtitles, currentTime }) => {
  return subtitles.map((props, i) => <Chunk key={i} {...{...props, currentTime}} />)
}

const Chunk = ({ words, startTime, endTime, currentTime }) => {
  const notCurrent = currentTime <= startTime || currentTime > endTime
  if (notCurrent) return <span>{words}</span>
  return (
    <span style={{ fontWeight: 'bold', backgroundColor: '#FFFF00' }}>
      {words}
    </span>
  )
}

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
