import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiForm,
  EuiSpacer
} from '@patronum/eui'
import '../styles/editor.css'
import '../styles/tags.css'

const ReadOnlyChapters = ({ chapters }) => {
  if(!chapters || !chapters.length) return null
  return (
    <EuiForm>
      <EuiSpacer size="xxl" />
      <EuiFlexGroup direction="column" gutterSize="m">
        {
          chapters.map(({ name, values }, key) => (
            <EuiFlexItem key={key}>
              <EuiText>
                <h4>{ name }</h4>
                {
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
                  ))
                }
              </EuiText>
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
