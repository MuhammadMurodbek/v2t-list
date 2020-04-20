/* eslint-disable react/prop-types */
// Used react synthetic event
import React, { Fragment } from 'react'
import {
  EuiSpacer,
  EuiText,
  EuiForm,
  EuiFormRow,
  EuiComboBox,
  EuiI18n
} from '@elastic/eui'
import '../App.css'

const Templates = ({
  listOfTemplates,
  defaultTemplateId,
  updateSectionHeader,
  updateTemplateId
}) => {
  const templateOptions = listOfTemplates
    .map((template) => ({ ...template, value: template.id, label: template.name }))
  const template = templateOptions
    .find(t => t.value === defaultTemplateId) || { label: '' }

  const onTemplateChange = (templates) => {
    if (!templates.length) return
    const template = templates[0]
    const sectionNames = (template.sections || []).map((section) => section.name)
    updateSectionHeader(sectionNames, template.value)
    updateTemplateId(template.value)
  }

  return (
    <Fragment>
      <EuiText size="xs">
        <h2>
          <EuiI18n token="journalTemplates" default="Journal Templates" />
        </h2>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiForm>
        <EuiFormRow
          label={
            <EuiI18n
              token="selectJournalTemplate"
              default="Select Journal Template"
            />
          }
        >
          <EuiComboBox
            options={templateOptions}
            selectedOptions={[template]}
            singleSelection={{ asPlainText: true }}
            onChange={onTemplateChange}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiForm>
    </Fragment>
  )
}

export default Templates
