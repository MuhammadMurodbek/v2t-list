// Used react synthetic event
import React, { Component, Fragment } from 'react'
import '../App.css'

class Seek extends Component {
  render() {
    return (
      <Fragment>
        <span className="seekBar" style={{ width: this.props.width, background: this.props.background }}></span>
      </Fragment>
    )
  }
}

export default Seek
