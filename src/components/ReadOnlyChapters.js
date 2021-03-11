import React, { Fragment, useContext } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiDatePicker
} from '@patronum/eui'
import moment from 'moment'
import '../styles/editor.css'
import '../styles/tags.css'
import { PreferenceContext } from '../components/PreferencesProvider'
import { LanguageContext } from '../context'

const ReadOnlyChapters = ({ 
  chapters, onCreate, onUpdate 
}) => {
  if (!chapters || !chapters.length) return null
  const [preferences] = useContext(PreferenceContext)

  return (
    <EuiForm>
      <EuiFlexGroup direction="column" gutterSize="m">
        {chapters.map(({ keyword, name, values }, key) => (
          <EuiFlexItem key={key}>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow style={{ paddingBottom: 0 }} label={name}>
                  <span></span>
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                {values.length ? (
                  !preferences.editReadOnly ? (
                    <ReadOnlyFields values={values} />
                  ) : (
                    <EditableFields
                      keyword={keyword}
                      values={values}
                      onUpdate={onUpdate}
                    />
                  )
                ) : (
                  <EuiFieldText onBlur={(e) => onCreate(keyword, e)} />
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiForm>
  )
}

ReadOnlyChapters.propTypes = {
  chapters: PropTypes.array,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

const ReadOnlyFields = ({ values }) => {
  const formattedDate = (str) => {
    return moment(str, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid() ?
      moment(str).format('YYYY-MM-DD HH:mm:ss') : str
  }
  return values.map(
    ({ value, description }, key) => (
      <div key={key}>
        {
          description ?
            <Fragment>
              <strong>{value}</strong> - {description}
            </Fragment>
            :
            formattedDate(value)
        }
      </div>
    ))
}
ReadOnlyFields.propTypes = {
  values: PropTypes.array.isRequired
}

const EditableFields = ({ keyword, values, onUpdate }) => {
  const { languagesList, language } = useContext(LanguageContext)
  const onChange = (value, index, type) => {
    values[index][type] = value
    onUpdate(keyword, values)
  }

  const formattedDate = (value, key) => {
    return moment(value, 'YYYY-MM-DDTHH:mm:ss.SSSSZ', true).isValid()
      ? <EuiDatePicker
        showTimeSelect
        selected={moment(value)}
        fullWidth
        showIcon={false}
        popperPlacement="left-start"
        dateFormat="YYYY-MM-DD HH:mm:ss"
        timeFormat="HH:mm:ss"
        locale={languagesList[language].code}
        onChange={(date) => onChange(date, key, 'value')}
      />
      : <EuiFieldText
        value={value}
        onChange={(e) => onChange(e.target.value, key, 'value')}
      />
  }

  return values.map(
    ({ value, description }, key) => (
      <div key={key}>
        {
          description ?
            <Fragment>
              <strong>
                <EuiFieldText 
                  value={value} 
                  onChange={(e) => onChange(e, key, 'value')} 
                />
              </strong> - 
              <EuiFieldText 
                value={description} 
                onChange={(e) => onChange(e, key, 'description')} 
              />
            </Fragment>
            :
            formattedDate(value, key)
        }
      </div>
    ))
}
EditableFields.propTypes = {
  keyword: PropTypes.string.isRequired,
  values: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired
}

export default ReadOnlyChapters
