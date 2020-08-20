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
    schemaId: PropTypes.string
  }

  state = {
    isLoading: false,
    selectedOption: [],
    options: {},
    tags: {},
    schema: null
  }

  componentDidMount() {
    this.loadSchema()
  }

  componentDidUpdate(prevProps) {
    const { tags, schemaId } = this.props
    if (JSON.stringify(prevProps.tags) !== JSON.stringify(tags)) {
      this.loadTagsFromTranscript()
    }
    if (prevProps.schemaId !== schemaId) {
      this.loadSchema()
    }
  }

  loadSchema = async () => {
    const { schemaId } = this.props
    if (!schemaId) return
    const { data: schema } = await api.getSchema(schemaId).catch(()=>({}))
    this.setState({schema})
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
          .filter(option => !tags[namespace].some(tag =>tag.value === option.value.toUpperCase()))
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
    const remainingCodes = tags[namespace].filter((el) => el.value !== value)
    this.props.updateTags({ ...tags, [namespace]: remainingCodes})
  }

  addCode = (namespace) => {
    const { tags } = this.props
    const { selectedOption } = this.state
    if (selectedOption.length > 0) {
      const data = selectedOption[0]
      const [value, description] = data.label.split(': ')
      const updatedCodes = [
        ...tags[namespace],
        {
          value,
          description
        }
      ]
      this.emptySelectedOption()
      this.props.updateTags({ ...tags, [namespace]: updatedCodes })
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
      const updatedTags = this.swap(tags[namespace], source.index, destination.index)
      this.props.updateTags({ ...tags, [namespace]: updatedTags })
    }
  }

  getLabel = (namespace) => {
    const { schema } = this.state
    const field = schema ? schema.fields.find(({id}) => id === namespace) : null
    return field ? field.name : ''
  }

  render() {
    const {
      options,
      isLoading,
      selectedOption,
      schema
    } = this.state
    const {tags} = this.props
    if (!schema || !schema.fields) return null
    const fieldFilter = namespace => schema.fields.some(({id}) => id === namespace)
    return (
      <EuiI18n tokens={['codes', 'lookFor']} defaults={['Codes', 'Look for']}>
        {([codes, lookFor]) =>
          <EuiFlexGroup direction="column">
            {
              TAG_NAMESPACES.filter(fieldFilter).map(namespace => (
                <EuiFlexItem
                  key={namespace}
                  grow={false}
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
                      style={ tags[namespace].length ? {} : { display: 'none' }}
                    >
                      <EuiDragDropContext onDragEnd={this.onDragEnd}>
                        <EuiDroppable droppableId={namespace} spacing="m" withPanel>
                          {tags[namespace].map(({ description, value }, idx) => (
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
              ))
            }
          </EuiFlexGroup>
        }
      </EuiI18n>
    )
  }
}
