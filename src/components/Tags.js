// @ts-nocheck
/* eslint-disable no-underscore-dangle */
import React, { Component, Fragment } from 'react'
import {
  EuiButtonIcon,
  EuiComboBox,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiPanel,
  EuiFlexGroup,
  EuiIcon,
  EuiRadioGroup
} from '@patronum/eui'

import api from '../api'
import '../styles/tags.css'
import { EuiI18n } from '@patronum/eui'
import { addUnexpectedErrorToast, addWarningToast } from './GlobalToastList'

export default class Tags extends Component {
  state = {
    tableOfCodes: [],
    isLoading: false,
    selectedOption: [],
    options: [],
    icd10Codes: [],
    kvaCodes: [],
    selectedRadioId: '0',
    nameSpacesStringForView: ['ICD-10', 'KVA'],
    selectedNameSpace: 'ICD-10',
    radios: [
      {
        id: '0',
        label: 'ICD-10'
      },
      {
        id: '1',
        label: 'KVA'
      }
    ]
  }

  componentDidUpdate(prevProps) {
    const { tags } = this.props
    if (prevProps.tags !== tags) {
      this.loadTagsFromTranscript()
    }
  }

  onChangeCodeSearch = (optionId) => {
    const { nameSpacesStringForView, selectedRadioId } = this.state
    this.setState({ selectedRadioId: optionId }, () => {
      if (selectedRadioId === '0') {
        this.setState({
          selectedNameSpace: nameSpacesStringForView[1],
          options: []
        })
      } else if (selectedRadioId === '1') {
        this.setState({
          selectedNameSpace: nameSpacesStringForView[0],
          options: []
        })
      }
    })
  }

  loadTagsFromTranscript = () => {
    const { tags } = this.props
    const icd10Codes = tags.filter((tag) => tag.namespace === 'icd-10')
    const kvaCodes = tags.filter((tag) => tag.namespace === 'kva')
    this.setState({
      tableOfCodes: tags,
      icd10Codes,
      kvaCodes
    })
  }

  loadIcdCodes = async (searchTerm, namespace) => {
    try {
      const codeData = await api.keywordsSearch(searchTerm, namespace)

      // Purpose of doing this is to use free text search
      if (codeData.data !== null) {
        const options = codeData.data.map((code) => {
          const label = `${code.value.toUpperCase()}: ${code.description}`
          return {
            ...code,
            label
          }
        })
        this.setState({ options })
      }
    } catch (e) {
      addUnexpectedErrorToast(e)
    }
  }

  deleteRow = (item) => {
    const { icd10Codes, kvaCodes } = this.state
    if (item.namespace === 'icd-10') {
      const remainingCodes = icd10Codes.filter((el) => el.id !== item.id)
      this.setState({ icd10Codes: remainingCodes }, () => {
        this.props.updateTags([...remainingCodes, ...kvaCodes])
      })
    } else if (item.namespace === 'kva') {
      const remainingCodes = kvaCodes.filter((el) => el.id !== item.id)
      this.setState({ kvaCodes: remainingCodes }, () => {
        this.props.updateTags([...icd10Codes, ...remainingCodes])
      })
    }
  }

  addCode = () => {
    const { selectedOption, icd10Codes, kvaCodes, selectedRadioId } = this.state
    if (selectedOption.length > 0) {
      let data = selectedOption[0]
      data = data.label.split(': ')

      if (selectedRadioId === '0') {
        if (icd10Codes.some((e) => e.id === data[0])) {
          addWarningToast(
            <EuiI18n
              token="ICDCodeError"
              default="The ICD code may only occur once"
            />
          )
          this.emptySelectedOption()
        } else {
          const updatedCodes = [
            ...icd10Codes,
            {
              id: data[0],
              namespace: 'icd-10',
              description: data[1]
            }
          ]
          this.setState({ icd10Codes: updatedCodes }, () => {
            this.emptySelectedOption()
            this.props.updateTags([...updatedCodes, ...kvaCodes])
          })
        }
      } else if (selectedRadioId === '1') {
        if (kvaCodes.some((e) => e.id === data[0])) {
          addWarningToast(
            <EuiI18n
              token="ICDCodeError"
              default="The ICD code may only occur once"
            />
          )
          this.emptySelectedOption()
        } else {
          const updatedCodes = [
            ...kvaCodes,
            {
              id: data[0],
              namespace: 'kva',
              description: data[1]
            }
          ]
          this.setState({ kvaCodes: updatedCodes }, () => {
            this.emptySelectedOption()
            this.props.updateTags([...icd10Codes, ...updatedCodes])
          })
        }
      }
    }
  }

  emptySelectedOption = () => {
    this.setState({ selectedOption: [] })
  }

  onChange = (selectedOption) => {
    this.setState(
      {
        selectedOption,
        options: []
      },
      this.addCode
    )
  }

  onSearchChange = async (searchValue) => {
    const { selectedRadioId } = this.state
    let namespace
    this.setState({
      isLoading: true
    })

    if (selectedRadioId === '0') {
      namespace = 'icd-10'
    } else if (selectedRadioId === '1') {
      namespace = 'kva'
    }

    await this.loadIcdCodes(searchValue, namespace)
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
    const { icd10Codes, kvaCodes } = this.state
    if (source && destination) {
      if (source.droppableId === 'icd-10') {
        this.setState(
          {
            icd10Codes: this.swap(icd10Codes, source.index, destination.index)
          },
          () => {
            this.props.updateTags([...icd10Codes, ...kvaCodes])
          }
        )
      } else if (source.droppableId === 'kva') {
        this.setState(
          {
            kvaCodes: this.swap(kvaCodes, source.index, destination.index)
          },
          () => {
            this.props.updateTags([...icd10Codes, ...kvaCodes])
          }
        )
      }
    }
  }

  render() {
    const {
      options,
      isLoading,
      selectedOption,
      icd10Codes,
      kvaCodes,
      radios,
      selectedRadioId,
      selectedNameSpace
    } = this.state

    return (
      <Fragment>
        <EuiI18n tokens={['code', 'lookFor']} defaults={['Code', 'Look for']}>
          {([code, lookFor]) => (
            <>
              <EuiText>
                <h6>{code}</h6>
              </EuiText>
              <EuiSpacer size="m" />
              <EuiRadioGroup
                options={radios}
                idSelected={selectedRadioId}
                className="searchCodes"
                onChange={(id) => this.onChangeCodeSearch(id)}
                name="radio group"
                compressed={true}
              />
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiComboBox
                    placeholder={`${lookFor} ${selectedNameSpace} ${code}`}
                    async
                    options={options}
                    selectedOptions={selectedOption}
                    singleSelection
                    isLoading={isLoading}
                    onChange={this.onChange}
                    onSearchChange={this.onSearchChange}
                  />                  
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          )}
        </EuiI18n>
        <EuiFlexItem
          grow={false}
          style={{
            display: icd10Codes.length > 0 ? 'block' : 'none'
          }}
        >
          {/* <EuiBasicTable
            className="transcript"
            items={tableOfCodes}
            columns={COLUMNS}
            hasActions
          /> */}
          <EuiSpacer size="m" />
          <EuiText>
            <h6>ICD-10 Kod</h6>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiDragDropContext onDragEnd={this.onDragEnd}>
            <EuiDroppable droppableId="icd-10" spacing="m" withPanel>
              {icd10Codes.map(({ description, id, namespace }, idx) => (
                <EuiDraggable
                  spacing="m"
                  key={id}
                  index={idx}
                  draggableId={id}
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
                          <strong>{id}</strong> {description}
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButtonIcon
                            iconSize="l"
                            color="danger"
                            onClick={() =>
                              this.deleteRow({ description, id, namespace })
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
        <EuiFlexItem
          grow={false}
          style={{
            display: kvaCodes.length > 0 ? 'block' : 'none'
          }}
        >
          {/* <EuiBasicTable
            className="transcript"
            items={tableOfCodes}
            columns={COLUMNS}
            hasActions
          /> */}
          <EuiSpacer size="xxl" />
          <EuiText>
            <h6>Åtgärdskod</h6>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiDragDropContext onDragEnd={this.onDragEnd}>
            <EuiDroppable droppableId="kva" spacing="m" withPanel>
              {kvaCodes.map(({ description, id, namespace }, idx) => (
                <EuiDraggable
                  spacing="m"
                  key={id}
                  index={idx}
                  draggableId={id}
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
                          <strong>{id}</strong> {description}
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiButtonIcon
                            iconSize="l"
                            color="danger"
                            onClick={() =>
                              this.deleteRow({ description, id, namespace })
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
      </Fragment>
    )
  }
}
