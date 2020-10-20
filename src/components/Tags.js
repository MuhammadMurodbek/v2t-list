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
import { addUnexpectedErrorToast } from './GlobalToastList'

export const TAG_NAMESPACES = ['icd-10', 'kva']

export default class Tags extends Component {
  static propTypes = {
    tags: PropTypes.object.isRequired,
    updateTags: PropTypes.func.isRequired,
    schema: PropTypes.object
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

    Object.keys(tags).forEach(namespace => {
      this.loadTags('', namespace)
    })
  }

  loadTags = async (searchTerm, namespace) => {
    const { tags } = this.props
    try {
      const codeData = await api.keywordsSearch(searchTerm, namespace)

      // Purpose of doing this is to use free text search
      if (codeData.data) {
        const options = codeData.data
          .filter(option => !tags[namespace].values.some(tag =>tag.value === option.value.toUpperCase()))
          .map((code) => {
            const label = `${code.value.toUpperCase()}: ${code.description}`
            return {
              ...code,
              label
            }
          })
        this.setState(prevState => ({
          options: {
            ...prevState.options,
            [namespace]: options
          }
        }))
      }
    } catch (e) {
      addUnexpectedErrorToast(e)
    }
  }

  deleteRow = (namespace, value) => {
    const { tags } = this.props
    const values = tags[namespace].values.filter((el) => el.value !== value)
    this.props.updateTags({ ...tags, [namespace]: {
      ...tags[namespace],
      values
    }})
  }

  addCode = (namespace) => {
    const { tags } = this.props
    const { selectedOption } = this.state
    if (selectedOption.length > 0) {
      const data = selectedOption[0]
      const [value, description] = data.label.split(': ')
      let values
      if (tags[namespace].values) {
        values = [
          ...tags[namespace].values,
          {
            value,
            description
          }
        ]
      } else {
        values = [{
          value,
          description
        }]
      }
      this.emptySelectedOption()
      this.props.updateTags({ ...tags, [namespace]: {
        ...tags[namespace],
        values
      }})
    }
  }

  emptySelectedOption = () => {
    this.setState({ selectedOption: [] })
  }

  onChange = (namespace, selectedOption) => {
    this.setState(
      {
        selectedOption
      },
      () => this.addCode(namespace)
    )
  }

  onSearchChange = async (namespace, searchValue) => {
    this.setState({
      isLoading: true
    })


    await this.loadTags(searchValue, namespace)
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
    const tags = JSON.parse(JSON.stringify(this.props.tags))
    if (source && destination) {
      const namespace = source.droppableId
      const values = this.swap(tags[namespace].values, source.index, destination.index)
      this.props.updateTags({ ...tags, [namespace]: { ...tags[namespace], values } })
    }
  }

  getLabel = (namespace) => {
    const { schema } = this.props
    const field = schema ? schema.originalFields.find(({id}) => id === namespace) : null
    return field ? field.name : ''
  }

  render() {
    const {
      options,
      isLoading,
      selectedOption
    } = this.state
    const {
      tags,
      schema
    } = this.props
    if (!schema || !schema.originalFields) return null
    return (
      <EuiI18n tokens={['codes', 'lookFor']} defaults={['Codes', 'Look for']}>
        {([codes, lookFor]) =>
          <EuiFlexGroup direction="column">
            {
              Object.entries(tags).map(([namespace, { values, visible }]) => values ? (
                <EuiFlexItem
                  key={namespace}
                  grow={false}
                  style={ !visible ? {
                    display: 'none'
                  } : {}}
                >
                  <EuiFlexGroup direction="column">
                    <EuiFlexItem grow={false}>
                      <EuiFormRow label={this.getLabel(namespace)}>
                        <EuiComboBox
                          placeholder={`${lookFor} ${this.getLabel(namespace)}`}
                          async
                          options={options[namespace] || []}
                          selectedOptions={selectedOption}
                          singleSelection
                          isLoading={isLoading}
                          onChange={selectedOptions => this.onChange(namespace, selectedOptions)}
                          onSearchChange={searchValue => this.onSearchChange(namespace, searchValue)}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem
                      grow={false}
                      style={ values.length ? {} : { display: 'none' }}
                    >
                      <EuiDragDropContext onDragEnd={this.onDragEnd}>
                        <EuiDroppable droppableId={namespace} spacing="m" withPanel>
                          {console.log('tags',tags)}
                          {console.log('values',values)}
                          {values.map(({ description, value }, idx) => (
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
                                          this.deleteRow(namespace, value)
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
              ) : null)
            }
          </EuiFlexGroup>
        }
      </EuiI18n>
    )
  }
}
