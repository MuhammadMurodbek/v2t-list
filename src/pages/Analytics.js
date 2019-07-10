import React, { Component } from 'react'

import analyticsImg from '../img/analytics.png'

export default class Analytics extends Component {
  componentDidMount = async () => {
    document.title = 'Inovia AI :: Analytics 📊'
  }

  render() {
    return (
      <img
        src={analyticsImg}
        alt="Analytics"
        height="1500"
        style={{ maxHeight: '80vw' }}
      />
    )
  }
}
