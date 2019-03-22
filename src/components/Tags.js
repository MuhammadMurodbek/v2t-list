import React, { Component } from 'react'
import {
  EuiSpacer, EuiText, EuiBasicTable, EuiComboBox
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
    }]

  state = {
    value: '',
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
    activeDrgIndex: 0,
    isLoading: false,
    isPopoverOpen: false,
    selectedOptions: [],
    options: []
  };


  componentDidMount() {
    // Simulate initial load.
    this.onSearchChange('')
  }

  showSuggestion =(e) => {
    this.setState({ value: e.target.value })
  }

  searchTag = () => {
    console.log('llllll')
    const { drgs, cursor } = this.state
    this.setState({ value: drgs[cursor].label })
  }

  navigateMenu = (e) => {
    const { cursor, drgs } = this.state
    const { values } = this.props

    if (e.keyCode === 38 && cursor > 0) {
      this.setState({
        cursor: cursor - 1
      })
    }

    if (e.keyCode === 40 && cursor < drgs.length - 1) {
      this.setState({ cursor: cursor + 1 })
    }


    let newDrgs = []
    drgs.map((drg, i) => {
      const tempDrg = {}
      if (i === cursor) {
        tempDrg.label = drg.label
        tempDrg.active = true
        newDrgs.push(tempDrg)
      } else {
        tempDrg.label = drg.label
        tempDrg.active = false
        newDrgs.push(tempDrg)
      }
    })
    this.setState({ drgs: newDrgs })
  }

  onChange = (selectedOptions) => {
    this.setState({
      selectedOptions
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
        options: Tags.allOptions.filter(option => option.label.toLowerCase().includes(searchValue.toLowerCase()))
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
    if (flattenedOptions.findIndex(option =>
      option.value.trim().toLowerCase() === normalizedSearchValue
    ) === -1) {
      // Simulate creating this option on the server.
      Tags.allOptions.push(newOption);
      this.setState(prevState => ({
        options: prevState.options.concat(newOption)
      }));
    }

    // Select the option.
    this.setState(prevState => ({
      selectedOptions: prevState.selectedOptions.concat(newOption)
    }))
  };

  render() {
    const label = (<h2>Tags</h2>)
    const { values } = this.props
    const { options, isLoading, selectedOptions } = this.state

    if (!values) return null
    return (
      <React.Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiSpacer size="m" />
        <EuiComboBox
          placeholder="Search DRG Codes"
          async
          rowHeight={55}
          options={options}
          selectedOptions={selectedOptions}
          singleSelection
          isLoading={isLoading}
          onChange={this.onChange}
          onSearchChange={this.onSearchChange}
          onCreateOption={this.onCreateOption}
        />
        <EuiSpacer size="m" />
        <EuiBasicTable
          className="transcript"
          items={values}
          columns={Tags.COLUMNS}
        />
      </React.Fragment>
    )
  }
}
