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
} from '@elastic/eui'

import swal from 'sweetalert'
import api from '../api'
import '../styles/tags.css'
import { EuiI18n } from '@elastic/eui'

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

  onChangeCodeSearch = optionId => {
    const { nameSpacesStringForView, selectedRadioId }  = this.state
    this.setState({selectedRadioId: optionId}, ()=>{
      if(selectedRadioId === '0') {
        this.setState({ selectedNameSpace: nameSpacesStringForView[1]})
      } else if (selectedRadioId === '1') {
        this.setState({ selectedNameSpace: nameSpacesStringForView[0] })
      }
    })
  }

  loadTagsFromTranscript = () => {
    const { tags } = this.props
    const icd10Codes = tags.filter(tag => tag.namespace === 'icd-10')
    const kvaCodes = tags.filter(tag => tag.namespace === 'kva')
    console.log('icd10Codes')
    console.log(icd10Codes)
    console.log('icd10Codes end')
    console.log('kva code')
    console.log(kvaCodes)
    console.log('kva code end')
    this.setState({
      tableOfCodes: tags,
      icd10Codes,
      kvaCodes
    }, () => {
      console.log('tableOfContents')
      console.log(this.state.tableOfCodes)
      console.log('tableOfCOntents')
    })
  }

  loadIcdCodes = async (searchTerm, namespace) => {
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
  }

  deleteRow = (item) => {
    const { tableOfCodes } = this.state
    const remainingCodes = tableOfCodes.filter((el) => el.id !== item.id)
    this.setState({ tableOfCodes: remainingCodes }, () => {
      this.props.updateTags(this.state.tableOfCodes)
    })
  }

  // addCode = () => {
  //   const { selectedOption, tableOfCodes } = this.state
  //   if (selectedOption.length > 0) {
  //     let data = selectedOption[0]
  //     data = data.label.split(': ')
  //     if (tableOfCodes.some((e) => e.id === data[0])) {
  //       // eslint-disable-next-line no-alert
  //       swal({
  //         title: 'ICD koden får endast förekomma 1 gång',
  //         text: '',
  //         icon: 'info',
  //         button: 'Avbryt'
  //       })
  //       this.emptySelectedOption()
  //     } else {
  //       const updatedCodes = [
  //         ...tableOfCodes,
  //         {
  //           id: data[0],
  //           description: data[1]
  //         }
  //       ]
  //       this.setState({ tableOfCodes: updatedCodes }, () => {
  //         this.emptySelectedOption()
  //         this.props.updateTags(this.state.tableOfCodes)
  //       })
  //     }
  //   }
  // }

  addCode = () => {
    const { selectedOption, tableOfCodes, icd10Codes, kvaCodes, selectedRadioId } = this.state
    if (selectedOption.length > 0) {
      let data = selectedOption[0]
      data = data.label.split(': ')

      if (selectedRadioId === '0') {
        if (icd10Codes.some((e) => e.id === data[0])) {
          // eslint-disable-next-line no-alert
          swal({
            title: 'ICD koden får endast förekomma 1 gång',
            text: '',
            icon: 'info',
            button: 'Avbryt'
          })
          this.emptySelectedOption()
        } else {
          const updatedCodes = [
            ...icd10Codes,
            {
              id: data[0],
              description: data[1]
            }
          ]
          this.setState({ icd10Codes: updatedCodes }, () => {
            this.emptySelectedOption()
            this.props.updateTags(this.state.tableOfCodes)
          })
        }
      } else if (selectedRadioId === '1') {
        if (kvaCodes.some((e) => e.id === data[0])) {
          // eslint-disable-next-line no-alert
          swal({
            title: 'ICD koden får endast förekomma 1 gång',
            text: '',
            icon: 'info',
            button: 'Avbryt'
          })
          this.emptySelectedOption()
        } else {
          const updatedCodes = [
            ...kvaCodes,
            {
              id: data[0],
              description: data[1]
            }
          ]
          this.setState({ kvaCodes: updatedCodes }, () => {
            this.emptySelectedOption()
            this.props.updateTags(this.state.tableOfCodes)
          })
        }
      }
    }
  }

  emptySelectedOption = () => {
    this.setState({ selectedOption: [] })
  }

  onChange = (selectedOption) => {
    this.setState({
      selectedOption,
      options: []
    }, this.addCode)
  }

  onSearchChange = async (searchValue) => {
    const {selectedRadioId} = this.state
    let namespace
    this.setState({
      isLoading: true
    })

    if (selectedRadioId=== '0') {
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
    const { tableOfCodes } = this.state
    if (source && destination) {
      this.setState(
        {
          tableOfCodes: this.swap(tableOfCodes, source.index, destination.index)
        },
        () => {
          this.props.updateTags(this.state.tableOfCodes)
        }
      )
    }
  }

  render() {
    const { options, isLoading, selectedOption, icd10Codes, kvaCodes, radios, selectedRadioId, selectedNameSpace } = this.state

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
                onChange={id => this.onChangeCodeSearch(id)}
                name="radio group"
                compressed={true}
              />
              <EuiSpacer size="m" />
              <div className="searchKoder" style={{ display: 'flex' }}>
                <span
                  style={{
                    width: 390,
                    marginRight: 20,
                    marginBottom: 25
                  }}
                >
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
                </span>
              </div>
            </>
          )}
        </EuiI18n>
        <EuiFlexItem
          grow={false}
          style={{
            width: 390,
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
            <EuiDroppable
              droppableId="CUSTOM_HANDLE_DROPPABLE_AREA"
              spacing="m"
              withPanel
            >
              {icd10Codes.map(({ description, id }, idx) => (
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
                          width: 390,
                          lineHeight: 1.5
                        }}
                      >
                        <EuiFlexItem>
                          <div {...provided.dragHandleProps}>
                            <EuiIcon type="grab" color="blue" />
                          </div>
                        </EuiFlexItem>
                        <EuiFlexItem
                          style={{ minWidth: 260, fontSize: '1rem' }}
                        >
                          <strong>{id}</strong> {description}
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiButtonIcon
                            iconSize="l"
                            color="danger"
                            onClick={() => this.deleteRow({ description, id })}
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
            width: 390,
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
            <h6>Åtgärds Kod</h6>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiDragDropContext onDragEnd={this.onDragEnd}>
            <EuiDroppable
              droppableId="CUSTOM_HANDLE_DROPPABLE_AREA"
              spacing="m"
              withPanel
            >
              {kvaCodes.map(({ description, id }, idx) => (
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
                          width: 390,
                          lineHeight: 1.5
                        }}
                      >
                        <EuiFlexItem>
                          <div {...provided.dragHandleProps}>
                            <EuiIcon type="grab" color="blue" />
                          </div>
                        </EuiFlexItem>
                        <EuiFlexItem
                          style={{ minWidth: 260, fontSize: '1rem' }}
                        >
                          <strong>{id}</strong> {description}
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiButtonIcon
                            iconSize="l"
                            color="danger"
                            onClick={() => this.deleteRow({ description, id })}
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
