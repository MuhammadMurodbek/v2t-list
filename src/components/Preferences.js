/* eslint-disable max-len */
/* eslint-disable react/prop-types */
import React, { Fragment, useState, useContext } from 'react'
import PropTypes from 'prop-types'
import {
  EuiButton,
  EuiFieldText,
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
  EuiInMemoryTable,
  EuiSwitch,
  EuiSuperSelect,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiSelect,
  EuiI18n,
  EuiHorizontalRule
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
  const { preferences, setPreferences, transcriptId } = usePreferences()
  const setColumns = (columnsForCombo) => setPreferences({ columnsForCombo })
  const setAutoPlayStatus = ({ target: { checked: autoPlayStatus }}) =>
    setPreferences({ autoPlayStatus })
  const setExternalMode = ({ target: { checked: externalMode }}) =>
    setPreferences({ externalMode })
  const setEditReadOnly = ({ target: { checked: editReadOnly }}) =>
    setPreferences({ editReadOnly })
  const setHideEditor = ({ target: { checked: hideEditor }}) =>
    setPreferences({ hideEditor })
  const setHideKeyword = ({ target: { checked: hideKeyword }}) =>
    setPreferences({ hideKeyword })
  const setStopButtonVisibilityStatus = ({
    target: { checked: stopButtonVisibilityStatus }
  }) => setPreferences({ stopButtonVisibilityStatus })
  const setShowVideo = ({ target: { checked: showVideo }}) =>
    setPreferences({ showVideo })
  const setFontSize = (currentFontSize) => setPreferences({ currentFontSize })
  const setAutoCorrectTable = (autoCorrectTable) =>
    setPreferences({ autoCorrectTable })
  const setIsMedicalAssistantActive = ({ target: { checked: isMedicalAssistantActive }}) =>
    setPreferences({ isMedicalAssistantActive })
  const setMedicalAssistantStatus = ({ target: { checked: medicalAssistantStatus }}) =>
    setPreferences({ medicalAssistantStatus })
  const setDecisionSupportStatus = ({ target: { checked: decisionSupportStatus }}) =>
    setPreferences({ decisionSupportStatus })
  const setCodingSupportStatus = ({ target: { checked: codingSupportStatus }}) =>
    setPreferences({ codingSupportStatus })
  const setContinuousSupportStatus = ({ target: { checked: continuousSupportStatus }}) =>
    setPreferences({ continuousSupportStatus })
  const [selectedTabId, setSelectedTabId] = useState('0')
  const [autoCorrectSelection, setAutoCorrectSelection] = useState([])
  const { language, setLanguage, languagesList } = useContext(LanguageContext)
  
  const languageOptions = languagesList.map((lang) => ({
    value: lang.id,
    text: lang.name
  }))

  const onLanguageChange = (e) => {
    setLanguage(e.target.value)
  }
 
 
  const columns = [
    {
      name: <EuiI18n token="Replace" default="REPLACE" />,
      render: ({ shortcut, index }) => (
        <EuiFieldText
          onChange={(e) => {
            const { value } = e.target
            const newTable = [...preferences.autoCorrectTable]
            newTable[index].shortcut = value
            setAutoCorrectTable(newTable)
          }}
          style={{ height: '100%' }}
          value={shortcut}
        />
      )
    },
    {
      name: <EuiI18n token="with" default="WITH" />,
      render: ({ value, index }) => (
        <EuiFieldText
          onChange={(e) => {
            const { value } = e.target
            const newTable = [...preferences.autoCorrectTable]
            newTable[index].value = value
            setAutoCorrectTable(newTable)
          }}
          style={{ height: '100%' }}
          value={value}
        />
      )
    }
  ]

  const tabs = [
    {
      id: '0',
      name: <EuiI18n token="general" default="General" />,
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
          <EuiI18n
            token="enterTheColumnsInTheOrderYouWantToDisplayThem"
            default="Enter the columns in the order you want to display them"
          >
            {(translation) => (
              <EuiFormRow fullWidth={true}>
                <EuiComboBox
                  sortMatchesBy="startsWith"
                  placeholder={translation}
                  selectedOptions={preferences.columnsForCombo}
                  options={COLUMN_OPTIONS}
                  onChange={setColumns}
                  fullWidth={true}
                />
              </EuiFormRow>
            )}
          </EuiI18n>
          <EuiSpacer size="l" />
          <EuiText>
            <h5>
              <EuiI18n token="editorSettings" default="Editor settings" />
            </h5>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiFormRow
            label={<EuiI18n token="textSize" default="Text size" />}
            fullWidth={true}
          >
            <EuiSuperSelect
              fullWidth={true}
              options={preferences.fontSizeList}
              valueOfSelected={preferences.currentFontSize}
              onChange={setFontSize}
              itemLayoutAlign="top"
              hasDividers
            />
          </EuiFormRow>
          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              label={<EuiI18n token="externalMode" default="External mode" />}
              checked={preferences.externalMode}
              onChange={setExternalMode}
            />
          </EuiFormRow>
          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              label={
                <EuiI18n
                  token="editReadOnlyFields"
                  default="Edit read-only fields"
                />
              }
              checked={preferences.editReadOnly}
              onChange={setEditReadOnly}
            />
          </EuiFormRow>
          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              label={<EuiI18n token="hideEditor" default="Hide editor" />}
              checked={preferences.hideEditor}
              onChange={setHideEditor}
            />
          </EuiFormRow>
          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              label={<EuiI18n token="hideKeyword" default="Hide sökord" />}
              checked={preferences.hideKeyword}
              onChange={setHideKeyword}
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

          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              className="autoplaySwitch"
              label={
                <EuiI18n token="enableAutostart" default="Enable autostart" />
              }
              checked={preferences.autoPlayStatus}
              onChange={setAutoPlayStatus}
            />
          </EuiFormRow>

          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              label={
                <EuiI18n token="showStopButton" default="Show stop button" />
              }
              checked={preferences.stopButtonVisibilityStatus}
              onChange={setStopButtonVisibilityStatus}
            />
          </EuiFormRow>
          <EuiFormRow label="" fullWidth={true}>
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
            fullWidth={true}
          >
            <EuiSelect
              id="languagesSelect"
              options={languageOptions}
              value={language}
              onChange={onLanguageChange}
              fullWidth={true}
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          <TranscriptId id={transcriptId} />
          <Logout setPreferences={setPreferences} />
        </Fragment>
      )
    },
    {
      id: '3',
      name: <EuiI18n token="autoCorrect" default="Autocorrect" />,
      content: (
        <Fragment>
          <EuiSpacer size="l" />
          <EuiFlexGroup direction="columnReverse">
            <EuiFlexItem style={{ marginTop: -30 }}>
              <EuiFormRow
                label={
                  <EuiI18n
                    token="ReplaceTextAsYouType"
                    default="Replace text as you type"
                  />
                }
                fullWidth
              >
                <EuiInMemoryTable
                  className="editableTable"
                  // this will temporarly fix the problem with selections:
                  items={preferences.autoCorrectTable.map((v, index) => ({
                    ...v,
                    index
                  }))}
                  itemId="index"
                  // itemId="id" temporaryly changed to the "position" 
                  // (i) eg. sorting won't work
                  // use "position" while id is temporarily 
                  // editable so the row doesn't loose focus
                  columns={columns}
                  isSelectable={true}
                  selection={{ onSelectionChange: setAutoCorrectSelection }}
                  sorting={false}
                  pagination={false}
                  cellProps={{ className: 'editable' }}
                />
              </EuiFormRow>
              <EuiFormRow style={{ marginTop: 0 }}>
                <EuiText size="s">
                  <span
                    onClick={() =>
                      setAutoCorrectTable([
                        ...preferences.autoCorrectTable,
                        { shortcut: '', value: '' }
                      ])
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    +
                    <EuiI18n token="createNewField" default="Add a new field" />
                  </span>
                </EuiText>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiButton
                    size="s"
                    disabled={!autoCorrectSelection.length}
                    onClick={() => {
                      const currentTable = [...preferences.autoCorrectTable]
                      setAutoCorrectTable(
                        currentTable.filter(
                          (field, index) =>
                            !autoCorrectSelection.some((s) => s.index === index)
                        )
                      )
                      setAutoCorrectSelection([])
                    }}
                  >
                    Delete
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      )
    },
    {
      id: '4',
      name: <EuiI18n token="medicinskAssistent" default="Medical Assistant" />,
      content: (
        <Fragment>
          <EuiSpacer size="m" />
          <EuiFormRow label="" fullWidth={true}>
            <EuiSwitch
              className="autoplaySwitch"
              label={
                <EuiI18n
                  token="activateMedicalAssistant"
                  default="Activate Medical Assistant"
                />
              }
              checked={preferences.isMedicalAssistantActive}
              onChange={setIsMedicalAssistantActive}
            />
          </EuiFormRow>
          <EuiSpacer size="l" />
          {localStorage.getItem('isMedicalAssistantActive') === 'true' && (
            <>
              <div style={{ marginLeft: 30 }}>
                <EuiFormRow label="" fullWidth={true}>
                  <EuiSwitch
                    className="autoplaySwitch"
                    label={
                      <EuiI18n
                        token="Kodningsassistent"
                        default="Coding assistant"
                      />
                    }
                    checked={preferences.codingSupportStatus}
                    onChange={setCodingSupportStatus}
                  />
                </EuiFormRow>
                <EuiFormRow label="" fullWidth={true}>
                  <EuiSwitch
                    className="autoplaySwitch"
                    label={
                      <EuiI18n
                        token="medicinskAssistent"
                        default="Medical Assistant"
                      />
                    }
                    checked={preferences.medicalAssistantStatus}
                    onChange={setMedicalAssistantStatus}
                  />
                </EuiFormRow>
                <EuiFormRow label="" fullWidth={true}>
                  <EuiSwitch
                    className="autoplaySwitch"
                    label={
                      <EuiI18n
                        token="Beslutstödsassistent"
                        default="Decision support assistant"
                      />
                    }
                    checked={preferences.decisionSupportStatus}
                    onChange={setDecisionSupportStatus}
                  />
                </EuiFormRow>
              </div>
              <EuiHorizontalRule />
              <EuiFormRow label="" fullWidth={true}>
                <EuiSwitch
                  className="autoplaySwitch"
                  label={
                    <EuiI18n token="oupphörlig" default="Interactive assistance" />
                  }
                  checked={preferences.continuousSupportStatus}
                  onChange={setContinuousSupportStatus}
                />
              </EuiFormRow>
            </>
          )}
          <EuiSpacer size="l" />
          <EuiSpacer size="l" />
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
    <EuiFlyout
      onClose={onClose}
      aria-labelledby="flyoutTitle"
      size="m"
      maxWidth="700px"
      className="preferencesFlyout"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h4 id="flyoutTitle">
            <EuiI18n token="settings" default="Settings" />
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody style={{ paddingLeft: '15px', paddingRight: '15px' }}>
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
