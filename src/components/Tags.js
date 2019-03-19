import React, { Component } from 'react'
import {
  EuiSpacer, EuiText, EuiBasicTable, EuiFieldSearch,
  EuiListGroup,
  EuiListGroupItem
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
      field: 'probability',
      name: 'Probability',
      width: '100px'
    }
  ]

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
    activeDrgIndex: 0
  };

  searchTag =(e) => {
    this.setState({ value: e.target.value })
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
    if (e.keyCode === 13 && drgs[cursor]) {
      e.target.value = drgs[cursor].label
      this.setState({ value: drgs[cursor].label })
    }
  }

  render() {
    const label = (<h2>Tags</h2>)
    const { values } = this.props
    const { value, drgs } = this.state
    const drgList = drgs.map(drg => (
      <ListOfCodes item={drg.label} active={drg.active} />
    ))

    if (!values) return null
    return (
      <React.Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiSpacer size="m" />
        <EuiFieldSearch
          placeholder="Search DRG Codes"
          onChange={this.searchTag}
          onKeyDown={this.navigateMenu}
          aria-label="Use aria labels when no actual label is in use"
        />

        <div style={(value === null || value.length === 0) ? { display: 'block' } : { display: 'none' }}>
          <EuiSpacer size="m" />
          <EuiBasicTable
            className="transcript"
            items={values}
            columns={Tags.COLUMNS}
          />
        </div>
        <div style={(value === null || value.length === 0) ? { display: 'none' } : { display: 'block' }}>
          <EuiListGroup bordered={true}>
            {drgList}
          </EuiListGroup>
        </div>
      </React.Fragment>
    )
  }
}

const ListOfCodes = ({ item, active }) => {
  if (active) {
    return (
      <EuiListGroupItem
        label={item}
        isActive
      />
    )
  }
  return (
    <EuiListGroupItem
      label={item}
    />
  )
}