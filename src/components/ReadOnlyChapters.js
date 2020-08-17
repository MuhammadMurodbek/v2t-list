import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiForm,
  EuiFormRow
} from '@patronum/eui'
import '../styles/editor.css'
import '../styles/tags.css'

const ReadOnlyChapters = ({ chapters, onCreate }) => {
  if(!chapters || !chapters.length) return null
  return (
    <EuiForm>
      <EuiFlexGroup direction="column" gutterSize="m">
        {
          chapters.map(({ keyword, name, values }, key) => (
            <EuiFlexItem key={key}>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFormRow style={{ paddingBottom: 0 }} label={name}>
                    <span></span>
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem>
                  {
                    values.length ?
                      values.map(({ value, description }, key) => (
                        <div key={ key }>
                          {
                            description ?
                              <Fragment>
                                <strong>{ value }</strong> - { description }
                              </Fragment>
                              :
                              value
                          }
                        </div>
                      )) :
                      <EuiFieldText onBlur={e => onCreate(keyword, e)} />
                  }
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          ))
        }
      </EuiFlexGroup>
    </EuiForm>
  )
}

ReadOnlyChapters.propTypes = {
  chapters: PropTypes.array
}

export default ReadOnlyChapters
