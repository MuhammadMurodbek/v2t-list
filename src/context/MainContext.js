import React, { createContext } from 'react'
import PropTypes from 'prop-types'

const MainContext = createContext()

const MainProvider = ({ children, value }) => {
  return (
    <MainContext.Provider value={value}>
      {children}
    </MainContext.Provider>
  )
}

MainProvider.propTypes = {
  children: PropTypes.any.isRequired,
  value: PropTypes.object.isRequired
}

export { MainProvider, MainContext }
