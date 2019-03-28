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
    options: [],
    icdCodes: [],
    allOptions: []
  };


  componentDidMount() {
    // Simulate initial load.
    this.onSearchChange('')
    this.loadIcdCodes()
  }

  loadIcdCodes = async () => {
    const codeData = await axios.post('/api/v1/code-service/search', {
      text: 'N905A postmenopausal blödning hos icke hormonbehandlad kvinna'
    })

    let convertedCodes = []
    // Purpose of doing this is to use free text search
    codeData.data.map((code) => {
      code.label =  `${code._source.Code}: ${code._source.CodeText}`
      convertedCodes.push(code)
    })

    this.setState({ allOptions: convertedCodes })
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
        alert("Item already exists on the list")
        this.emptySelectedOption()
      } else {
        const temp = tableOfCodes
        temp.push(newCode)
        this.setState({ tableOfCodes: temp }, ()=> {
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
      selectedOption
    })
  }

  onSearchChange = (searchValue) => {
    this.setState({
      isLoading: true,
      options: []
    })

    clearTimeout(this.searchTimeout)

    this.searchTimeout = setTimeout(() => {
      // Simulate a remotely-executed search.
      this.setState({
        isLoading: false,
        options: this.state.allOptions.filter(
          option => option.label.toLowerCase().includes(searchValue.toLowerCase())
        )
      })
    }, 1200)
  }

  render() {
    const label = (<h2>Tags</h2>)
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
              placeholder="Search DRG Codes"
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
