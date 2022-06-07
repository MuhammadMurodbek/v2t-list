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
} from '@elastic/eui'

import api from '../api'
import '../styles/tags.css'
import { EuiI18n } from '@elastic/eui'
import { addUnexpectedErrorToast } from './GlobalToastList'

export const TAG_NAMESPACES = new Set(['icd-10', 'kva', 'icf'])


export default class Tags extends Component {
  static propTypes = {
    tags: PropTypes.object.isRequired,
    updateTags: PropTypes.func.isRequired,
    schema: PropTypes.object,
    isRevoked: PropTypes.bool
  }

  state = {
    isLoading: false,
    selectedOptions: {
      'icd-10': [],
      'kva': [],
      'icf': []
    },
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

    Object.keys(tags).forEach(([namespace, { dictionary }]) => {
      this.loadOptions('', namespace, undefined, dictionary)
    })
  }

  loadOptions = async (searchTerm = '', namespace, dictionaryValue) => {
    const { tags } = this.props
    this.loadOption(
      searchTerm,
      dictionaryValue,
      tags[namespace]?.type?.select?.options,
      namespace
    )
  }

  loadOption = async (searchTerm, dictionaryValue, options, namespace) => {
    if (!options || !options.length)
      this.fetchOptions(searchTerm, namespace, dictionaryValue)
    else
      this.setState(prevState => ({ options: {
        ...prevState.options,
        [namespace]: options.map(code => ({ code, label: code }))
      }}))
  }

  fetchOptions = async (searchTerm, namespace, dictionaryValue) => {
    const { tags } = this.props
    try {
      const codeData = await api.keywordsSearch(searchTerm, dictionaryValue)

      // Purpose of doing this is to use free text search
      if (codeData.data) {
        const options = codeData.data
          .filter(
            (option) =>
              !tags[namespace].values.some(
                (tag) => tag.value === option.value.toUpperCase()
              )
          )
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
            [dictionaryValue]: options
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

  addCode = (namespace, dictionary) => {
    const { tags } = this.props
    const { selectedOptions } = this.state
    if (selectedOptions[dictionary].length > 0) {
      const data = selectedOptions[dictionary][0]
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
    this.setState({
      selectedOptions: {
        'icd-10': [],
        'kva': [],
        'icf': []
      }
    })
  }

  onChange = (namespace, dictionary, selectedOption) => {
    this.setState(prevState => (
      {
        selectedOptions: {
          ...prevState.selectedOptions,
          [dictionary]: selectedOption
        }
      }
    ),
    () => this.addCode(namespace, dictionary))
  }

  onSearchChange = async (namespace, dictionaryValue, searchValue) => {
    this.setState({
      isLoading: true
    })


    await this.loadOptions(searchValue, namespace, dictionaryValue)
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
      const values = this.swap(
        tags[namespace].values,
        source.index,
        destination.index
      )
      this.props.updateTags({
        ...tags,
        [namespace]: { ...tags[namespace], values }
      })
    }
  }

  getLabel = (namespace) => {
    const { schema } = this.props
    const field = schema
      ? schema.originalFields.find(({ id }) => id === namespace)
      : null
    return field ? field.name : ''
  }

  render() {
    const {
      options,
      isLoading,
      selectedOptions
    } = this.state
    const {
      tags,
      schema
    } = this.props
    if (!schema || !schema.originalFields) return null
    return (
      <EuiI18n tokens={['lookFor']} defaults={['Look for']}>
        {([lookFor]) => (
          <EuiFlexGroup direction="column">
            {Object.entries(tags).map(([namespace, 
              { values, visible, dictionary }]) =>
              values ? (
                <EuiFlexItem
                  key={namespace}
                  grow={false}
                  style={!visible? { display: 'none' }: {}
                  }
                >
                  <EuiFlexGroup direction="column">
                    <EuiFlexItem grow={false}>
                      <EuiFormRow label={namespace}>
                        <EuiComboBox
                          isDisabled={this.props.isRevoked}
                          sortMatchesBy="startsWith"
                          placeholder={`${lookFor} ${namespace}`}
                          async
                          options={options[dictionary] || []}
                          selectedOptions={selectedOptions[dictionary]}
                          singleSelection
                          isLoading={isLoading}
                          onChange={(selectedOptions) =>
                            this.onChange(
                              namespace,
                              dictionary,
                              selectedOptions
                            )
                          }
                          onSearchChange={(searchValue) =>
                            this.onSearchChange(
                              namespace,
                              dictionary,
                              searchValue
                            )
                          }
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem
                      grow={false}
                      style={values.length ? {} : { display: 'none' }}
                    >
                      <EuiDragDropContext onDragEnd={this.onDragEnd}>
                        <EuiDroppable
                          droppableId={namespace}
                          spacing="m"
                          withPanel
                        >
                          {values.map(({ description, value }, idx) => (
                            <EuiDraggable
                              spacing="m"
                              key={value}
                              index={idx}
                              draggableId={value}
                              customDragHandle={true}
                              isDragDisabled={this.props.isRevoked}
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
                                    <EuiFlexItem
                                      style={{
                                        alignItems: 'end'
                                      }}
                                    >
                                      <EuiButtonIcon
                                        iconSize="l"
                                        color="danger"
                                        onClick={() =>
                                          this.deleteRow(namespace, value)
                                        }
                                        iconType="trash"
                                        aria-label="Next"
                                        className="selectorBottons"
                                        isDisabled={this.props.isRevoked}
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
              ) : null
            )}
          </EuiFlexGroup>
        )}
      </EuiI18n>
    )
  }
}
