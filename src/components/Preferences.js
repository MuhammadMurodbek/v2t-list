import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFormRow, EuiComboBox, EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader, EuiText,
  EuiTitle, EuiIcon, EuiSwitch, EuiSuperSelect, EuiSpacer
} from '@elastic/eui'

import { usePreferences } from './PreferencesProvider'
import { COLUMN_OPTIONS } from '../models/Preference'

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
  const onCreateKeyword = keyword => setPreferences({
    keywords: [...preferences.keywords, { label: keyword }]
  })
  const setKeywords = keywords => setPreferences({ keywords })
  const setAudioOnly = audioOnly => setPreferences({ audioOnly })
  const setAutoPlayStatus = autoPlayStatus => setPreferences({ autoPlayStatus })
  const setFontSize = currentFontSize => setPreferences({ currentFontSize })


  return (
    <EuiFlyout onClose={onClose} aria-labelledby="flyoutTitle" size="s">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h4 id="flyoutTitle">
            Preferences
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <Fragment>
          <EuiText><h5>Flux settings</h5></EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow label="Backlog columns">
            <EuiComboBox
              placeholder="Enter the columns in the order you want to display them"
              selectedOptions={preferences.columns}
              options={COLUMN_OPTIONS}
              onChange={setColumns}
            />
          </EuiFormRow>

          <EuiSpacer size="l" />
          <EuiText><h5>Editor settings</h5></EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow label="Font size">
            <EuiSuperSelect
              options={preferences.fontSizeList}
              valueOfSelected={preferences.currentFontSize}
              onChange={setFontSize}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <EuiText><h5>Uppspelning</h5></EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow>
            <EuiSwitch
              label="Show video"
              checked={preferences.getAudioOnly}
              onChange={setAudioOnly}
            />
          </EuiFormRow>

          <EuiFormRow label="">
            <EuiSwitch
              className="autoplaySwitch"
              label="Enable autoplay"
              checked={preferences.autoPlayStatus}
              onChange={setAutoPlayStatus}
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
