import React, { Component, Fragment } from 'react'
import axios from 'axios'
import Diff from 'text-diff'

import {
  EuiFlexGroup, EuiFlexItem, EuiText, EuiTextColor, EuiButton
} from '@elastic/eui'

export default class Editor extends Component {
  static defaultProps = {
    diffInstance: new Diff(),
    transcript: null
  }

  state = {
    diff: null,
  }

  assignRefsOnce = () => {
    const { transcript } = this.props
    if (!transcript) return
    this.inputRefs = Object.keys(transcript).reduce((refs, keyword) => {
      refs[keyword] = React.createRef()
      return refs
    }, {})
  }

  onChange = (e) => {
    const content = this.getContent(e)
    const diff = this.getDiff(content)
    this.setState({ diff })
  }

  getContent = (e) => {
    const { target } = e
    return Object.values(this.inputRefs).map(ref => ref.current.innerText.trim()).join(' ')
  }

  getDiff = (content) => {
    const { diffInstance, transcript } = this.props
    const original = Object.values(transcript)
      .flatMap(subtitles => subtitles.map(subtitle => subtitle.props.words)).join(' ')
    const diff = diffInstance.main(original, content)
    diffInstance.cleanupSemantic(diff)
    return diff.map((d, i) => this.parseDiff(i, d, diff))
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
    return ''
  }

  finalize = () => {
    // empty blocks
    const updatedTranscript = Object.values(this.inputRefs).map(ref => ref.current.innerText).join('')
    const {id} = this.props
    const queryString = `/api/v1/transcription/${id}`
    axios.put(queryString,
      {
        tags: null,
        transcriptions: [
          {
            keyword: "test",
            segments: [
              {
                words: updatedTranscript,
                startTime: null,
                endTime: null
              }
            ]
          }
        ]
      })
      .then((response) => {
        alert('Transcript is updated')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  save = () => {
    // empty blocks
  }

  cancel = () => {
    // empty blocks
  }

  render() {
    const { transcript } = this.props
    const { diff } = this.state
    if (!transcript) return null
    this.assignRefsOnce()
    return (
      <EuiText size="s">
        <EditableChapters
          transcripts={transcript}
          inputRefs={this.inputRefs}
          onChange={this.onChange}
          onSelect={this.props.onSelect}
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

const EditableChapters = ({ transcripts, inputRefs, onChange, onSelect }) => {
  if (!inputRefs) return null
  return Object.keys(transcripts).map((keyword, i) => (
    <EditableChapter
      key={i}
      keyword={keyword}
      subtitles={transcripts[keyword]}
      inputRefs={inputRefs}
      onChange={onChange}
      onSelect={onSelect}
    />
  ))
}

const EditableChapter = ({ key, keyword, subtitles, inputRefs, onChange, onSelect }) => {
  return (
    <Fragment>
      <h2>{keyword}</h2>
      <pre>
        <code
          onInput={onChange}
          contentEditable
          suppressContentEditableWarning
          ref={inputRefs[keyword]}
          onSelect={onSelect}
        >
          {subtitles}
        </code>
      </pre>
    </Fragment>
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
