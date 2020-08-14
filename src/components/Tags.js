// @ts-nocheck
/* eslint-disable no-underscore-dangle */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  EuiButtonIcon,
  EuiComboBox,
  EuiFlexItem,
  EuiFormRow,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiPanel,
  EuiFlexGroup,
  EuiIcon
} from '@patronum/eui'

import api from '../api'
import '../styles/tags.css'
import { EuiI18n } from '@patronum/eui'
import { addUnexpectedErrorToast, addWarningToast } from './GlobalToastList'

export const CODE_NAMESPACES = {
  icd10Codes: 'icd-10',
  kvaCodes: 'kva'
}

export default class Tags extends Component {
  static propTypes = {
    tags: PropTypes.object.isRequired,
    updateTags: PropTypes.func.isRequired
  }

  state = {
    isLoading: false,
    selectedOption: [],
    options: {},
    tags: {}
  }
 
  componentDidUpdate(prevProps) {
    const { tags } = this.props
    if (JSON.stringify(prevProps.tags) !== JSON.stringify(tags)) {
      this.loadTagsFromTranscript()
    }
  }

  loadTagsFromTranscript = () => {
    const { tags } = this.props
    this.setState({ tags })

    Object.keys(tags).forEach(tagType => {
      this.loadIcdCodes('', tagType)
    })
  }

  loadIcdCodes = async (searchTerm, tagType) => {
    try {
      const codeData = await api.keywordsSearch(searchTerm, CODE_NAMESPACES[tagType])

      // Purpose of doing this is to use free text search
      if (codeData.data) {
        const options = codeData.data.map((code) => {
          const label = `${code.value.toUpperCase()}: ${code.description}`
          return {
            ...code,
            label
          }
        })
        this.setState(prevState => ({
          options: {
            ...prevState.options,
            [tagType]: options
          }
        }))
      }
    } catch (e) {
      addUnexpectedErrorToast(e)
    }
  }

  deleteRow = (tagType, value) => {
    const { tags } = this.state
    const remainingCodes = tags[tagType].filter((el) => el.value !== value)
    this.setState(prevState => ({
      tags: {
        ...prevState.tags,
        [tagType]: remainingCodes
      }
    }), () => {
      this.props.updateTags({ ...tags, [tagType]: remainingCodes})
    })
  }

  addCode = (tagType) => {
    const { selectedOption, tags } = this.state
    if (selectedOption.length > 0) {
      const data = selectedOption[0]
      const [value, description] = data.label.split(': ')

      if (tags[tagType].some((e) => e.value === value)) {
        addWarningToast(
          <EuiI18n
            token="ICDCodeError"
            default={`The ${CODE_NAMESPACES[tagType]} code may only occur once`}
          />
        )
        this.emptySelectedOption()
      } else {
        const updatedCodes = [
          ...tags[tagType],
          {
            value,
            description
          }
        ]
        this.setState(prevState => ({
          tags: {
            ...prevState.tags,
            [tagType]: updatedCodes
          }
        }), () => {
          this.emptySelectedOption()
          this.props.updateTags({ ...tags, [tagType]: updatedCodes })
        })
      }
    
    }
  }

  emptySelectedOption = () => {
    this.setState({ selectedOption: [] })
  }

  onChange = (tagType, selectedOption) => {
    this.setState(
      {
        selectedOption
      },
      () => this.addCode(tagType)
    )
  }

  onSearchChange = async (tagType, searchValue) => {
    this.setState({
      isLoading: true
    })


    await this.loadIcdCodes(searchValue, tagType)
    this.setState({
      isLoading: false
    })
  }

  swap = (arr, source, destination) => {
    const temp = arr[source]
    arr[source] = arr[destination]
    arr[destination] = temp
    return arr
  }

  onDragEnd = ({ source, destination }) => {
    const { tags } = this.state
    if (source && destination) {
      const tagType = source.droppableId
      this.setState((prevState) => ({
        tags: {
          ...prevState.tags,
          [tagType]: this.swap(tags[tagType], source.index, destination.index)
        }
      }),
      () => {
        this.props.updateTags({ ...tags })
      }
      )
    }
  }

  render() {
    const {
      options,
      isLoading,
      selectedOption
    } = this.state
    const {tags} = this.props
    return (
      <EuiI18n tokens={['codes', 'lookFor']} defaults={['Codes', 'Look for']}>
        {([codes, lookFor]) =>
          <EuiFlexGroup direction="column">
            {
              Object.keys(tags).map((tagType) => (
                <EuiFlexItem
                  key={tagType}
                  grow={false}
                >
                  <EuiFlexGroup direction="column">
                    <EuiFlexItem grow={false}>
                      <EuiFormRow label={`${CODE_NAMESPACES[tagType].toUpperCase()} ${codes}`}>
                        <EuiComboBox
                          placeholder={`${lookFor} ${CODE_NAMESPACES[tagType].toUpperCase()} ${codes}`}
                          async
                          options={options[tagType] || []}
                          selectedOptions={selectedOption}
                          singleSelection
                          isLoading={isLoading}
                          onChange={selectedOptions => this.onChange(tagType, selectedOptions)}
                          onSearchChange={searchValue => this.onSearchChange(tagType, searchValue)}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem
                      grow={false}
                      style={ tags[tagType].length ? {} : { display: 'none' }}
                    >
                      <EuiDragDropContext onDragEnd={this.onDragEnd}>
                        <EuiDroppable droppableId={tagType} spacing="m" withPanel>
                          {tags[tagType].map(({ description, value }, idx) => (
                            <EuiDraggable
                              spacing="m"
                              key={value}
                              index={idx}
                              draggableId={value}
                              customDragHandle={true}
                            >
                              {(provided) => (
                                <EuiPanel className="custom" paddingSize="m">
                                  <EuiFlexGroup
                                    style={{
                                      lineHeight: 1.5
                                    }}
                                  >
                                    <EuiFlexItem grow={false}>
                                      <div {...provided.dragHandleProps}>
                                        <EuiIcon type="grab" color="blue" />
                                      </div>
                                    </EuiFlexItem>
                                    <EuiFlexItem
                                      style={{
                                        fontSize: '1rem'
                                      }}
                                    >
                                      <strong>{value}</strong> {description}
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiButtonIcon
                                        iconSize="l"
                                        color="danger"
                                        onClick={() =>
                                          this.deleteRow(tagType, value)
                                        }
                                        iconType="trash"
                                        aria-label="Next"
                                        className="selectorBottons"
                                      />
                                    </EuiFlexItem>
                                  </EuiFlexGroup>
                                </EuiPanel>
                              )}
                            </EuiDraggable>
                          ))}
                        </EuiDroppable>
                      </EuiDragDropContext>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              ))
            }
          </EuiFlexGroup>
        }
      </EuiI18n>
    )
  }
}
