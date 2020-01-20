/* eslint-disable no-underscore-dangle */
import React, { Component, Fragment } from 'react'
import {
  EuiBasicTable,
  EuiButtonIcon,
  EuiComboBox,
  EuiFlexItem,
  EuiSpacer,
  EuiText
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
        const temp = tableOfCodes
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

  render() {
    const label = (<h2>Kod</h2>)
    const {
      options, isLoading, selectedOption, tableOfCodes
    } = this.state

    const COLUMNS = [
      {
        field: 'id',
        name: 'Kod',
        sortable: true,
        width: '80px',
        render: (item) => {
          return item.toUpperCase()
        }
      },
      {
        field: 'description',
        name: 'Beskrivning',
        width: '300px'
      },
      {
        name: '',
        actions: [{
          render: (item) => {
            return (
              <EuiButtonIcon
                iconSize="l"
                color="danger"
                onClick={() => this.deleteRow(item)}
                iconType="trash"
                aria-label="Next"
              />
            )
          }
        }]
      }]

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
        <EuiFlexItem grow={false} style={{ width: 380, display: tableOfCodes.length > 0 ? 'block' : 'none' }}>
          <EuiBasicTable
            className="transcript"
            items={tableOfCodes}
            columns={COLUMNS}
            hasActions
          />
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
