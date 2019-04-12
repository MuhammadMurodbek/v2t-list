// Used react synthetic event
import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import '../App.css'

const Seek = ({ width, background }) => (
  <Fragment>
    <span className="seekBar" style={{ width, background }} />
  </Fragment>
)

Seek.propTypes = {
  width: PropTypes.number.isRequired,
  background: PropTypes.string.isRequired
}

export default Seek
