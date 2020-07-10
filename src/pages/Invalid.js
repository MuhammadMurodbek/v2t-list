import React from 'react'
import PropTypes from 'prop-types'
import { EuiFlexGroup, EuiFlexItem, EuiButton, EuiI18n } from '@elastic/eui'

const Invalid = ({title, message}) => {
  return (
    <div
      style={{
        width: '100%',
        padding: '12px',
        height: '100vh'
      }}
    >
      <EuiFlexGroup alignItems="center" style={{
        height: '100%'
      }}>
        <EuiFlexItem>
          <h1
            style={{
              color: 'white',
              fontSize: '10rem',
              textAlign: 'center'
            }}
          >
            404
          </h1>

          <p
            style={{
              color: 'white',
              fontSize: '3rem',
              textAlign: 'center',
              lineHeight: '1.2',
              margin: '1rem'
            }}
          >
            {
              title ? title : (
                <EuiI18n
                  token="thePageCouldNotBeFound"
                  default="The page could not be found"
                />
              )
            }
          </p>
          {
            message &&
            <p
              style={{
                color: 'white',
                fontSize: '1rem',
                textAlign: 'center'
              }}
            >
              { message }
            </p>
          }
          <EuiButton
            href="/"
            style={{
              width: '300px',
              margin: '30px auto',
              textTransform: 'uppercase',
              fontWeight: '800'
            }}
            fill
          >
            <EuiI18n token="back" default="Back" />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  )
}

Invalid.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(EuiI18n)
  ]),
  message: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(EuiI18n)
  ])
}

export default Invalid
