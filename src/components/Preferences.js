import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFormRow, EuiComboBox, EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader,
  EuiTitle, EuiIcon, EuiRadioGroup, EuiSwitch, EuiSuperSelect
} from '@elastic/eui'

import { usePreferences } from './PreferencesProvider'
import { COLUMN_OPTIONS, WORD_OPTIONS } from '../models/Preference'

const Preferences = () => {
  const [visible, setVisible] = useState(false)

  return (
    <Fragment>
      <Button onClick={() => setVisible(true)} />
      <Flyout visible={visible} onClose={() => setVisible(false)} />
    </Fragment>
  )
}

const Button = ({ onClick }) => (
  <EuiIcon
    type="gear"
    size="xl"
    className="gear"
    onClick={onClick}
  />
)

const Flyout = ({ visible, onClose }) => {
  if (!visible) return null
  const [preferences, setPreferences] = usePreferences()
  const setColumns = columns => setPreferences({ columns })
  const setWords = words => setPreferences({ words })
  const onCreateKeyword = keyword => setPreferences({
    keywords: [...preferences.keywords, { label: keyword }]
  })
  const setKeywords = keywords => setPreferences({ keywords })
  const setAudioOnly = audioOnly => setPreferences({ audioOnly })
  const setHighlightMode = highlightMode => setPreferences({ highlightMode })
  const setFontSize = currentFontSize => setPreferences({ currentFontSize })


  return (
    <EuiFlyout onClose={onClose} aria-labelledby="flyoutTitle">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h4 id="flyoutTitle">
            Preferences
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <Fragment>
          <EuiFormRow label="Backlog columns">
            <EuiComboBox
              placeholder="Enter the columns in the order you want to display them"
              selectedOptions={preferences.columns}
              options={COLUMN_OPTIONS}
              onChange={setColumns}
            />
          </EuiFormRow>
          <EuiFormRow label="Highlighted words">
            <EuiRadioGroup
              options={WORD_OPTIONS}
              idSelected={preferences.words}
              onChange={setWords}
            />
          </EuiFormRow>
          <EuiFormRow label="Journal inputs">
            <EuiComboBox
              noSuggestions
              placeholder="Each input will be mapped to the journal system"
              selectedOptions={preferences.keywords}
              onCreateOption={onCreateKeyword}
              onChange={setKeywords}
            />
          </EuiFormRow>
          <EuiFormRow label="Audio only">
            <EuiSwitch
              label="Ignore any video"
              checked={preferences.audioOnly}
              onChange={setAudioOnly}
            />
          </EuiFormRow>
          <EuiFormRow label="Highlights the words">
            <EuiSwitch
              label="Highlight"
              checked={false}
              onChange={setHighlightMode}
            />
          </EuiFormRow>
          <EuiFormRow label="Font size">
            <EuiSuperSelect
              options={preferences.fontSizeList}
              valueOfSelected={preferences.currentFontSize}
              onChange={setFontSize}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
        </Fragment>
      </EuiFlyoutBody>
    </EuiFlyout>
  )
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired
}

Flyout.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default Preferences
