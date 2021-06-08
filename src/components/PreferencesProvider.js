import React, { createContext, useContext } from 'react'
import PropTypes from 'prop-types'

export const PreferenceContext = createContext()
export const usePreferences = () => useContext(PreferenceContext)

const PreferencesProvider = ({ value, children }) => (
  <PreferenceContext.Provider value={value}>
    {children}
  </PreferenceContext.Provider>
)

PreferencesProvider.propTypes = {
  value: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
}

export default PreferencesProvider
