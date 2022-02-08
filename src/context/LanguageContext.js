// @ts-nocheck
import React, { useState, createContext } from 'react'
import PropTypes from 'prop-types'
import { LanguagesConfig } from '../config'
import { EuiContext } from '@elastic/eui'
import sv_SE from '../locale/sv_SE.json'
import no_NO from '../locale/no_NO.json'
import da_DK from '../locale/da_DK.json'

const LanguageContext = createContext()

const LanguageProvider = ({ children }) => {
  const { languagesList, defaultLanguageId } = LanguagesConfig

  const [language, setLanguageState] = useState(defaultLanguageId)

  let localLanguage = localStorage.getItem('language')

  if (localLanguage === null || localLanguage === undefined) {
    localStorage.setItem('language', defaultLanguageId)
    localLanguage = defaultLanguageId
  }

  if (localLanguage !== language) {
    if (localLanguage >= languagesList.length || localLanguage < 0) {
      localStorage.setItem('language', defaultLanguageId)
      localLanguage = defaultLanguageId
      setLanguageState(defaultLanguageId)
    } else {
      setLanguageState(localLanguage)
    }
  }

  const setLanguage = (langId) => {
    setLanguageState(langId)
    localStorage.setItem('language', langId)
  }

  const mappings = {
    sv_SE,
    no_NO,
    da_DK
  }

  const i18n = {
    mapping: mappings[languagesList[language].code]
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languagesList }}>
      <EuiContext i18n={i18n}>{children}</EuiContext>
    </LanguageContext.Provider>
  )
}

LanguageProvider.propTypes = {
  children: PropTypes.any
}

export { LanguageProvider, LanguageContext }
