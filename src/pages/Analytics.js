import React, { Component } from 'react'

import analyticsImg from '../img/analytics.png'

export default class Analytics extends Component {

  render() {
    return (
      <img src={analyticsImg} height='1500' style={{ maxHeight: '80vw' }} />
    )
  }
}
