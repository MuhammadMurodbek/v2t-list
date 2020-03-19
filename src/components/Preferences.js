import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiComboBox, EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader, EuiText,
  EuiTitle, EuiIcon, EuiSwitch, EuiSuperSelect, EuiSpacer, EuiTab,
  EuiTabs
} from '@elastic/eui'

import help from '../img/help.png'
import Logout from '../components/Logout'
import { usePreferences } from './PreferencesProvider'
import { COLUMN_OPTIONS } from '../models/Preference'
import TranscriptId from './TranscriptId'

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
  window.open("https://inoviagroup.se/anvandarhandledning-v2t/", "_blank")
}

const Button = ({ onClick }) => (
  <EuiFlexGroup>
    <EuiFlexItem>
      <EuiIcon
        type="gear"
        size="xl"
        className="gear"
        onClick={onClick}
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <img
        src={help}
        className="help"
        alt="mic"
        onClick={openHelpWindow}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
  
)

const Flyout = ({ visible, onClose }) => {
  if (!visible) return null
  const [preferences, setPreferences] = usePreferences()
  const setColumns = columnsForCombo => setPreferences({ columnsForCombo })
  const setAutoPlayStatus = autoPlayStatus => setPreferences({ autoPlayStatus })
  const setStopButtonVisibilityStatus = stopButtonVisibilityStatus => setPreferences({ stopButtonVisibilityStatus })
  const setShowVideo = showVideo => setPreferences({ showVideo })
  const setFontSize = currentFontSize => setPreferences({ currentFontSize })
  const [selectedTabId, setSelectedTabId] = useState('0')
  const transcriptId = localStorage.getItem('transcriptId')
  const tabs = [
    {
      id: '0',
      name: 'Editor',
      content: (
        <Fragment>
          <EuiText><h5>Inställningar för aktivitetslista</h5></EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow>
            <EuiComboBox
              placeholder="Enter the columns in the order you want to display them"
              selectedOptions={preferences.columnsForCombo}
              options={COLUMN_OPTIONS.map(({ render, ...items }) => items)}
              onChange={setColumns}
            />
          </EuiFormRow>

          <EuiSpacer size="l" />
          <EuiText><h5>Inställningar för Editor</h5></EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow label="Textstorlek">
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
      name: 'Uppspelning',
      content: (
        <Fragment>
          <EuiText><h5>Uppspelning</h5></EuiText>

          <EuiSpacer size="m" />

          <EuiFormRow label="">
            <EuiSwitch
              className="autoplaySwitch"
              label="Aktivera autostart"
              checked={preferences.autoPlayStatus}
              onChange={setAutoPlayStatus}
            />
          </EuiFormRow>

          <EuiFormRow label="">
            <EuiSwitch
              label="Visa stoppknapp"
              checked={preferences.stopButtonVisibilityStatus}
              onChange={setStopButtonVisibilityStatus}
            />
          </EuiFormRow>
          <EuiFormRow label="">
            <EuiSwitch
              className="videoSwitch"
              label="Visa video"
              checked={preferences.showVideo}
              onChange={setShowVideo}
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <TranscriptId id={transcriptId} />
          <Logout setPreferences={setPreferences} />
        </Fragment>
      )
    }
  ]

  const onSelectedTabChanged = id => {
    setSelectedTabId(id)
  }

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <Fragment key={index}>
        <EuiTab
          onClick={() => onSelectedTabChanged(tab.id)}
          isSelected={tab.id === selectedTabId}
          key={index}>
          {tab.name}
        </EuiTab>
      </Fragment>
      
    ));
  }



  return (
    <EuiFlyout onClose={onClose} aria-labelledby="flyoutTitle" size="s">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h4 id="flyoutTitle">
            Inställningar
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiTabs style={{ marginBottom: '-25px' }}>
          {renderTabs()}
        </EuiTabs>
        {/* {tabs[selectedTabId].id} */}
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
