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
  EuiIcon
} from '@elastic/eui'

import swal from 'sweetalert'
import api from '../api'
import '../styles/tags.css'

export default class Tags extends Component {
  state = {
    tableOfCodes: [],
    isLoading: false,
    selectedOption: [],
    options: []
  }

  componentDidUpdate(prevProps) {
    const { tags } = this.props
    if (prevProps.tags !== tags) {
      this.loadTagsFromTranscript()
    }
  }

  loadTagsFromTranscript = () => {
    const { tags } = this.props
    this.setState({ tableOfCodes: tags })
  }

  loadIcdCodes = async (searchTerm) => {
    const codeData = await api.keywordsSearch(searchTerm)

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
    const remainingCodes = tableOfCodes.filter(el => el.id !== item.id)
    this.setState({ tableOfCodes: remainingCodes }, () => {
      this.props.updateTags(this.state.tableOfCodes)
    })
  }

  addCode = () => {
    const { selectedOption, tableOfCodes } = this.state
    // console.log('selectedOption')
    // console.log(selectedOption)
    // console.log('tableOfCodes')
    // console.log(tableOfCodes)
    if (selectedOption.length > 0) {
      let data = selectedOption[0]
      data = data.label.split(': ')
      const newCode = {
        id: data[0],
        description: data[1]
      }

      if (tableOfCodes.some(e => e.id === data[0])) {
        // eslint-disable-next-line no-alert
        swal({
          title: 'ICD koden får endast förekomma 1 gång',
          text: '',
          icon: 'info',
          button: 'Avbryt'
        })
        this.emptySelectedOption()
      } else {
        let temp = tableOfCodes
        temp.push(newCode)
        this.setState({ tableOfCodes: temp }, () => {
          this.emptySelectedOption()
          this.props.updateTags(this.state.tableOfCodes)
        })
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
    })
  }

  onSearchChange = async (searchValue) => {
    this.setState({
      isLoading: true
    })

    await this.loadIcdCodes(searchValue)
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
    const {tableOfCodes} = this.state
    if (source && destination) {
      this.setState({ 
        tableOfCodes: this.swap(tableOfCodes, source.index, destination.index)
      })
    }
  };

  render() {
    const label = (<h2>Kod</h2>)
    const {
      options, isLoading, selectedOption, tableOfCodes
    } = this.state

    return (
      <Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiSpacer size="m" />
        <div className="searchKoder" style={{ display: 'flex' }}>
          <span style={{
            width: 344,
            marginRight: 20,
            marginBottom: 25
          }}>
            <EuiComboBox
              placeholder="Sök ICD-10 kod"
              async
              options={options}
              selectedOptions={selectedOption}
              singleSelection
              isLoading={isLoading}
              onChange={this.onChange}
              onSearchChange={this.onSearchChange}
            />
          </span>
          <span style={{ marginTop: '4px' }}>
            <AddButton onClick={this.addCode} />
          </span>
        </div>
        <EuiFlexItem grow={false} style={{ width: 400, display: tableOfCodes.length > 0 ? 'block' : 'none' }}>
          {/* <EuiBasicTable
            className="transcript"
            items={tableOfCodes}
            columns={COLUMNS}
            hasActions
          /> */}
          <EuiSpacer size="l" />
          <EuiDragDropContext onDragEnd={this.onDragEnd}>
            <EuiDroppable
              droppableId="CUSTOM_HANDLE_DROPPABLE_AREA"
              spacing="m"
              withPanel>
              {tableOfCodes.map(({ description, id }, idx) => (
                <EuiDraggable
                  spacing="m"
                  key={id}
                  index={idx}
                  draggableId={id}
                  customDragHandle={true}>
                  {provided => (
                    <EuiPanel className="custom" paddingSize="m">
                      <EuiFlexGroup style={{
                        width: 380, lineHeight: 1.5}}>
                        <EuiFlexItem>
                          <div {...provided.dragHandleProps}>
                            <EuiIcon type="grab" color="blue"/>
                          </div>
                        </EuiFlexItem>
                        <EuiFlexItem style={{ minWidth: 260, fontSize: '1rem' }}><strong>{id}</strong>  {description}</EuiFlexItem>
                        <EuiFlexItem>
                          <EuiButtonIcon
                            iconSize="l"
                            color="danger"
                            onClick={
                              () => this.deleteRow({ description, id })
                            }
                            iconType="trash"
                            aria-label="Next"
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

const AddButton = props => (
  <Fragment>
    <EuiButtonIcon
      iconSize="xl"
      color="subdued"
      onClick={props.onClick}
      iconType="listAdd"
      aria-label="Next"
    />
  </Fragment>
)
