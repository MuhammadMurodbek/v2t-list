import React, {createContext, useContext} from 'react'

export const PreferenceContext = createContext()
export const usePreferences = () => useContext(PreferenceContext)

export const PreferencesProvider = ({value, children}) => (
  <PreferenceContext.Provider value={value}>
    {children}
  </PreferenceContext.Provider>
)

export default PreferencesProvider
