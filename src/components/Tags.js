import React, { Component, Fragment } from 'react'
import {
  EuiSpacer, EuiText, EuiBasicTable, EuiComboBox, EuiButtonIcon, EuiFlexItem
} from '@elastic/eui'
import '../styles/tags.css'

export default class Tags extends Component {
  static defaultProps = {
    values: []
  }

  static COLUMNS = [
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
      field: 'delete',
      name: '',
      width: '40px'
    }
  ]

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
    cursor: 0,
    drgs: [
      {
        label: 'L007: Fever',
        active: true
      },
      {
        label: 'L008: Mild Fever',
        active: false
      },
      {
        label: 'L009: Throat sore',
        active: false
      },
      {
        label: 'L011: Nose bleeding',
        active: false
      }
    ],
    isLoading: false,
    selectedOption: [],
    options: []
  };


  componentDidMount() {
    // Simulate initial load.
    this.onSearchChange('')
  }

  addCode = () => {
    const { selectedOption, tableOfCodes } = this.state
    if (selectedOption.length > 0) {
      let data = selectedOption[0]
      data = data.label.split(':')
      this.setState({ selectedOption: [] }, () => {
        const temp = tableOfCodes
        temp.push(
          {
            code: data[0],
            description: data[1],
            delete: '🗑'
          }
        )
        this.setState({ tableOfCodes: temp })
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

  onCreateOption = (searchValue, flattenedOptions) => {
    const normalizedSearchValue = searchValue.trim().toLowerCase()

    if (!normalizedSearchValue) {
      return
    }

    const newOption = {
      label: searchValue
    };

    // Create the option if it doesn't exist.
    if (flattenedOptions.findIndex(option => option.value.trim().toLowerCase() 
      === normalizedSearchValue) === -1) {
      // Simulate creating this option on the server.
      Tags.allOptions.push(newOption)
      this.setState(prevState => ({
        options: prevState.options.concat(newOption)
      }))
    }

    // Select the option.
    this.setState(prevState => ({
      selectedOption: prevState.selectedOption.concat(newOption)
    }))
  };

  render() {
    const label = (<h2>Tags</h2>)
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
              onCreateOption={this.onCreateOption}
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
            columns={Tags.COLUMNS}
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
