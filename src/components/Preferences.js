import React, { Fragment, useState, useContext } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiComboBox,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiText,
  EuiTitle,
  EuiIcon,
  EuiSwitch,
  EuiSuperSelect,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiSelect,
  EuiI18n
} from '@elastic/eui'

import help from '../img/help.png'
import Logout from '../components/Logout'
import { usePreferences } from './PreferencesProvider'
import { COLUMN_OPTIONS } from '../models/Preference'
import TranscriptId from './TranscriptId'
import { LanguageContext } from '../context'

const Preferences = () => {
  const [visible, setVisible] = useState(false)

  return (
    <Fragment>
      <Button onClick={() => setVisible(true)} />
      <Flyout visible={visible} onClose={() => setVisible(false)} />
    </Fragment>
  )
}

const openHelpWindow = () => {
  window.open('https://inoviagroup.se/anvandarhandledning-v2t/', '_blank')
}

const Button = ({ onClick }) => (
  <EuiFlexGroup>
    <EuiFlexItem>
      <EuiIcon type="gear" size="xl" className="gear" onClick={onClick} />
    </EuiFlexItem>
    <EuiFlexItem>
      <img src={help} className="help" alt="mic" onClick={openHelpWindow} />
    </EuiFlexItem>
  </EuiFlexGroup>
)

const Flyout = ({ visible, onClose }) => {
  if (!visible) return null
  const [preferences, setPreferences] = usePreferences()
  const setColumns = (columnsForCombo) => setPreferences({ columnsForCombo })
  const setAutoPlayStatus = (autoPlayStatus) =>
    setPreferences({ autoPlayStatus })
  const setStopButtonVisibilityStatus = (stopButtonVisibilityStatus) =>
    setPreferences({ stopButtonVisibilityStatus })
  const setShowVideo = (showVideo) => setPreferences({ showVideo })
  const setFontSize = (currentFontSize) => setPreferences({ currentFontSize })
  const [selectedTabId, setSelectedTabId] = useState('0')
  const transcriptId = localStorage.getItem('transcriptId')
  const { language, setLanguage, languagesList } = useContext(LanguageContext)

  const languageOptions = languagesList.map((lang) => ({
    value: lang.id,
    text: lang.name
  }))

  const onLanguageChange = (e) => {
    setLanguage(e.target.value)
  }

  const tabs = [
    {
      id: '0',
      name: <EuiI18n token="editor" default="Editor" />,
      content: (
        <Fragment>
          <EuiText>
            <h5>
              <EuiI18n
                token="activityListSettings"
                default="Activity list settings"
              />
            </h5>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow>
            <EuiComboBox
              placeholder={
                <EuiI18n
                  token="enterTheColumnsInTheOrderYouWantToDisplayThem"
                  default="Enter the columns in the order you want to display them"
                />
              }
              selectedOptions={preferences.columnsForCombo}
              options={COLUMN_OPTIONS}
              onChange={setColumns}
            />
          </EuiFormRow>

          <EuiSpacer size="l" />
          <EuiText>
            <h5>
              <EuiI18n token="editorSettings" default="Editor settings" />
            </h5>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow label={<EuiI18n token="textSize" default="Text size" />}>
            <EuiSuperSelect
              options={preferences.fontSizeList}
              valueOfSelected={preferences.currentFontSize}
              onChange={setFontSize}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <TranscriptId id={transcriptId} />
          <Logout setPreferences={setPreferences} />
        </Fragment>
      )
    },
    {
      id: '1',
      name: <EuiI18n token="playback" default="Playback" />,
      content: (
        <Fragment>
          <EuiText>
            <h5>
              <EuiI18n token="playback" default="Playback" />
            </h5>
          </EuiText>

          <EuiSpacer size="m" />

          <EuiFormRow label="">
            <EuiSwitch
              className="autoplaySwitch"
              label={
                <EuiI18n token="enableAutostart" default="Enable autostart" />
              }
              checked={preferences.autoPlayStatus}
              onChange={setAutoPlayStatus}
            />
          </EuiFormRow>

          <EuiFormRow label="">
            <EuiSwitch
              label={
                <EuiI18n token="showStopButton" default="Show stop button" />
              }
              checked={preferences.stopButtonVisibilityStatus}
              onChange={setStopButtonVisibilityStatus}
            />
          </EuiFormRow>
          <EuiFormRow label="">
            <EuiSwitch
              className="videoSwitch"
              label={<EuiI18n token="viewVideo" default="View video" />}
              checked={preferences.showVideo}
              onChange={setShowVideo}
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <TranscriptId id={transcriptId} />
          <Logout setPreferences={setPreferences} />
        </Fragment>
      )
    },
    {
      id: '2',
      name: <EuiI18n token="language" default="Language" />,
      content: (
        <Fragment>
          <EuiText>
            <h5>
              <EuiI18n token="changeLanguage" default="Change language" />
            </h5>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow
            label={<EuiI18n token="selectLanguage" default="Select language" />}
          >
            <EuiSelect
              id="languagesSelect"
              options={languageOptions}
              value={language}
              onChange={onLanguageChange}
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <TranscriptId id={transcriptId} />
          <Logout setPreferences={setPreferences} />
        </Fragment>
      )
    }
  ]

  const onSelectedTabChanged = (id) => {
    setSelectedTabId(id)
  }

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <Fragment key={index}>
        <EuiTab
          onClick={() => onSelectedTabChanged(tab.id)}
          isSelected={tab.id === selectedTabId}
          key={index}
        >
          {tab.name}
        </EuiTab>
      </Fragment>
    ))
  }

  return (
    <EuiFlyout onClose={onClose} aria-labelledby="flyoutTitle" size="s">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h4 id="flyoutTitle">
            <EuiI18n token="settings" default="Settings" />
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiTabs style={{ marginBottom: '-25px' }}>{renderTabs()}</EuiTabs>
        <EuiSpacer size="l" />
        <EuiSpacer size="l" />
        {tabs[selectedTabId].content}
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
