import React, { Component } from 'react'
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

  componentDidMount() {
    this.ref = React.createRef()
  }


  onChange = (e) => {
    const content = this.getContent(e)
    const diff = this.getDiff(content)
    this.setState({ diff })
  }

  getContent = (e) => {
    const { target } = e
    if (target.textContent.length > 0) return target.textContent
    return [...target.querySelectorAll('span')].map(span => span.textContent).join(' ')
  }

  getDiff = (content) => {
    const { diffInstance, transcript } = this.props
    const original = transcript.map(component => component.props.text).join(' ')
    const diff = diffInstance.main(original, content).filter(d => d[1] !== ' ')
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
    const { transcript } = this.props.words 
    console.log('updated')
    console.log(transcript)

    // const {id} = this.props
    // const queryString = `/api/v1/transcription/${id}`
    // console.log(id)
    // axios.put(queryString,
    //   {
    //     tags: null,
    //     transcriptions: [
    //       {
    //         keyword: "test",
    //         segments: [
    //           {
    //             words: "ett två tre fyra",
    //             startTime: null,
    //             endTime: null
    //           }
    //         ]
    //       }
    //     ]
    //   })
    //   .then((response) => {
    //     console.log(response)
    //   })
    //   .catch((error) => {
    //     console.log(error)
    //   })
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
    return (
      <EuiText size="s">
        <h2>Transcript</h2>
        <pre>
          <code onInput={this.onChange} contentEditable suppressContentEditableWarning>
            {transcript}
          </code>
        </pre>
        <EuiFlexGroup>
          <EuiFlexItem>
            <pre style={(diff === null || diff.length === 1) ? { display: 'none' } : { display: 'block' }}>
              <code>
                {diff}
              </code>
            </pre>
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

const RemovedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="danger">- </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="danger">{diff[1].replace(/  */, ' ')}</EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)

const AddedLine = ({ diff, prevDiff, nextDiff }) => (
  <div>
    <EuiTextColor color="secondary">+ </EuiTextColor>
    {prevDiff[1].split(' ').slice(-3).join(' ')}
    <EuiTextColor color="secondary">{diff[1].replace(/  */, ' ')}</EuiTextColor>
    {nextDiff[1].split(' ').slice(0, 3).join(' ')}
  </div>
)
