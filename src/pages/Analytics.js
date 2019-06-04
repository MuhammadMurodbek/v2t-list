import React, { Component } from 'react'

import analyticsImg from '../img/analytics.png'

export default class Analytics extends Component {
  
  componentDidMount = async () => {
    document.title = 'Inovia AB :: Analytics 📊'
  }

  render() {
    return (
      <img src={analyticsImg} width='1000' height='818' />
    )
  }
}
