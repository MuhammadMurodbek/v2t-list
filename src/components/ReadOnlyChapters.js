import React, { Fragment, useContext } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiDatePicker,
  EuiComboBox,
  EuiAccordion
} from '@elastic/eui'
import moment from 'moment'
import '../styles/editor.css'
import '../styles/tags.css'
import { PreferenceContext } from '../components/PreferencesProvider'
import { LanguageContext } from '../context'

const ReadOnlyChapters = ({ chapters, onCreate, onUpdate }) => {
  if (!chapters || !chapters.length) return null
  const { preferences } = useContext(PreferenceContext)
  return (
    <EuiAccordion
      id="readOnlyChaptersMetadata"
      initialIsOpen={false}
      buttonContent="Metadata"
    >
      <EuiForm style={{ paddingTop: 16 }}>
        <EuiFlexGroup direction="column" gutterSize="m">
          {chapters.map(
            ({ keyword, name, values, type = {}}, key) => (
              <EuiFlexItem key={key}>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiFormRow style={{ paddingBottom: 0 }} label={name}>
                      <span></span>
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    {values ? (
                      !preferences.editReadOnly ? (
                        <ReadOnlyFields values={values} />
                      ) : (
                        <EditableFields
                          keyword={keyword}
                          values={values}
                          options={type?.select?.options || []}
                          isMultiSelect={type?.select?.multiple}
                          onUpdate={onUpdate}
                        />
                      )
                    ) : (
                      <EuiFieldText onBlur={(e) => onCreate(keyword, e)} />
                    )}
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            )
          )}
        </EuiFlexGroup>
      </EuiForm>
    </EuiAccordion>
  )
}

ReadOnlyChapters.propTypes = {
  chapters: PropTypes.array,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

const ReadOnlyFields = ({ values }) => {
  const formattedDate = (str) => {
    return moment(str, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()
      ? moment(str).format('YYYY-MM-DD HH:mm:ss')
      : str
  }
  return values.map(({ value, description }, key) => (
    <div key={key}>
      {description ? (
        <Fragment>
          <strong>{value}</strong> - {description}
        </Fragment>
      ) : (
        formattedDate(value)
      )}
    </div>
  ))
}
ReadOnlyFields.propTypes = {
  values: PropTypes.array.isRequired
}

const EditableFields = ({
  keyword,
  values,
  options,
  isMultiSelect,
  onUpdate
}) => {
  const { languagesList, language } = useContext(LanguageContext)
  const onChange = (value, index, type) => {
    values[index][type] = value
    onUpdate(keyword, values)
  }

  const formattedDate = (value, key) => {
    return moment(value, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid() ? (
      <EuiDatePicker
        showTimeSelect
        selected={moment(value)}
        fullWidth
        showIcon={false}
        dateFormat="YYYY-MM-DD HH:mm:ss"
        timeFormat="HH:mm:ss"
        locale={languagesList[language].code}
        onChange={(date) => onChange(date, key, 'value')}
      />
    ) : (
      <EuiFieldText
        value={value}
        onChange={(e) => onChange(e.target.value, key, 'value')}
      />
    )
  }

  if (options.length)
    return (
      <Selector
        {...{
          keyword,
          options,
          values,
          isMultiSelect,
          onUpdate
        }}
      />
    )

  return values.map(({ value, description }, key) => (
    <div key={key}>
      {description ? (
        <Fragment>
          <strong>
            <EuiFieldText
              value={value}
              onChange={(e) => onChange(e, key, 'value')}
            />
          </strong>{' '}
          -
          <EuiFieldText
            value={description}
            onChange={(e) => onChange(e, key, 'description')}
          />
        </Fragment>
      ) : (
        formattedDate(value, key)
      )}
    </div>
  ))
}
EditableFields.propTypes = {
  keyword: PropTypes.string.isRequired,
  values: PropTypes.array.isRequired,
  options: PropTypes.array,
  isMultiSelect: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired
}

const Selector = ({ keyword, options, values, isMultiSelect, onUpdate }) => (
  <EuiComboBox
    isClearable={false}
    options={options.map((label) => ({ label }))}
    selectedOptions={values.map(({ value }) => ({ label: value }))}
    singleSelection={!isMultiSelect && { asPlainText: true }}
    onChange={(selectedOptions) => {
      const values = selectedOptions.map(({ label }) => ({ value: label }))
      onUpdate(keyword, values)
    }}
  />
)

Selector.propTypes = {
  keyword: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  values: PropTypes.array.isRequired,
  isMultiSelect: PropTypes.bool,
  onUpdate: PropTypes.func.isRequired
}

export default React.memo(ReadOnlyChapters)
