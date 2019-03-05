import React, { Component } from 'react'
import {
  EuiListGroup, EuiListGroupItem, EuiText
} from '@elastic/eui'

export default class Tags extends Component {
  static defaultProps = {
    values: []
  }

  state = {
    borderStatus: true
  };

  render() {
    const label = (<h2>Tags</h2>)
    const { values } = this.props
    const { borderStatus } = this.state
    return (
      <React.Fragment>
        <EuiText size="xs">
          {label}
        </EuiText>
        <EuiListGroup bordered={borderStatus}>
          {values.map(value => <EuiListGroupItem key={value.code} label={value.info} isActive/>) }
        </EuiListGroup>
      </React.Fragment>
    )
  }
}
