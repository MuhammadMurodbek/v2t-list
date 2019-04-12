/* eslint-disable no-underscore-dangle */
import React, { Component, Fragment } from 'react'
import {
  EuiSpacer, EuiText, EuiBasicTable, EuiComboBox, EuiButtonIcon, EuiFlexItem
} from '@elastic/eui'
import axios from 'axios'

import '../styles/tags.css'

export default class Tags extends Component {
  static defaultProps = {
    values: []
  }

  state = {
    tableOfCodes: this.props.values,
    isLoading: false,
    selectedOption: [],
    options: []
  };

  loadIcdCodes = async (searchTerm) => {
    const codeData = await axios.post('/api/v1/code-service/search', {
      text: searchTerm
    })

    const convertedCodes = []
    // Purpose of doing this is to use free text search
    if (codeData.data !== null) {
      // eslint-disable-next-line array-callback-return
      codeData.data.map((code) => {
        // eslint-disable-next-line no-param-reassign
        code.label = `${code._source.Code}: ${code._source.CodeText}`
        convertedCodes.push(code)
      })
      this.setState({ options: convertedCodes })
    }
  }

  deleteRow = (item) => {
    const { tableOfCodes } = this.state
    const remainingCodes = tableOfCodes.filter(el => el._source.Code !== item._source.Code)
    this.setState({ tableOfCodes: remainingCodes })
  }

  addCode = () => {
    const { selectedOption, tableOfCodes } = this.state
    if (selectedOption.length > 0) {
      let data = selectedOption[0]
      data = data.label.split(':')
      const newCode = {
        _source: {
          Code: data[0],
          CodeText: data[1]
        }
      }

      if (tableOfCodes.some(e => e._source.Code === data[0])) {
        // eslint-disable-next-line no-alert
        alert('Item already exists on the list')
        this.emptySelectedOption()
      } else {
        const temp = tableOfCodes
        temp.push(newCode)
        this.setState({ tableOfCodes: temp }, () => {
          this.emptySelectedOption()
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
    const label = (<h2>Codes</h2>)
    const {
      options, isLoading, selectedOption, tableOfCodes
    } = this.state

    const COLUMNS = [
      {
        field: '_source.Code',
        name: 'Code',
        sortable: true,
        width: '80px'
      },
      {
        field: '_source.CodeText',
        name: 'Description',
        width: '300px'
      },
      {
        name: '',
        actions: [{
          render: (item) => {
            return (
              <EuiButtonIcon
                style={{ display: 'contents' }}
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
          <span style={{ width: 344, marginRight: 20, marginBottom: 25 }}>
            <EuiComboBox
              placeholder="Search ICD-10 Codes"
              async
              options={options}
              selectedOptions={selectedOption}
              singleSelection
              isLoading={isLoading}
              onChange={this.onChange}
              onSearchChange={this.onSearchChange}
            />
          </span>
          <span>
            <AddButton onClick={this.addCode} />
          </span>
        </div>
        <EuiFlexItem grow={false} style={{ width: 380 }}>
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
      style={{ display: 'contents' }}
      iconSize="xxl"
      color="subdued"
      onClick={props.onClick}
      iconType="listAdd"
      aria-label="Next"
    />
  </Fragment>
)
