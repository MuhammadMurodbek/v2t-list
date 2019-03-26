import React, { Component, Fragment } from 'react'
import {
  EuiSpacer, EuiText, EuiBasicTable, EuiComboBox, EuiButtonIcon, EuiFlexItem
} from '@elastic/eui'
import '../styles/tags.css'

export default class Tags extends Component {
  static defaultProps = {
    values: []
  }

  static allOptions = [
    {
      label: 'L007: Fever'
    }, {
      label: 'L008: Mild Fever'
    }, {
      label: 'L009: Throat sore'
    }, {
      label: 'L011: Nose bleeding'
    },
    {
      label: 'L023: Knee Osterarthritis'
    }, {
      label: 'L035: Elbow Osterarthritis'
    }, {
      label: 'L036: Back Osterarthritis'
    }, {
      label: 'L040: Neck Osterarthritis'
    }]

  state = {
    tableOfCodes: this.props.values,
    isLoading: false,
    selectedOption: [],
    options: []
  };


  componentDidMount() {
    // Simulate initial load.
    this.onSearchChange('')
  }

  deleteRow = (item) => {
    const { tableOfCodes } = this.state
    const remainingCodes = tableOfCodes.filter(el => el.code !== item.code)
    this.setState({ tableOfCodes: remainingCodes })
  }

  addCode = () => {
    const { selectedOption, tableOfCodes } = this.state
    if (selectedOption.length > 0) {
      let data = selectedOption[0]
      data = data.label.split(':')
      this.setState({ selectedOption: [] }, () => {
        const newCode = {
          code: data[0],
          description: data[1]
        }

        if (tableOfCodes.some(e => e.code === data[0])) {
          alert("Item already exists on the list")
        } else {
          const temp = tableOfCodes
          temp.push(newCode)
          this.setState({ tableOfCodes: temp })
        }
      })
    }
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
        options: Tags.allOptions.filter(
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
        field: 'code',
        name: 'DRG Code',
        sortable: true,
        width: '100px'
      },
      {
        field: 'description',
        name: 'Description',
        width: '200px'
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
        <EuiFlexItem grow={false} style={{ width: 400 }}>
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
