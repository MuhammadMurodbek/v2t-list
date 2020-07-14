import React, { Fragment } from 'react'
import { EuiSpacer, EuiFormRow, EuiButtonEmpty, EuiI18n } from '@patronum/eui'

const Logout = ({ setPreferences }) => {
  const logout = () => {
    setPreferences({ token: '' })
    window.location.replace('/')
  }

  return (
    <Fragment>
      <EuiSpacer size="l" />
      <EuiSpacer size="l" />
      <EuiFormRow label="">
        <EuiButtonEmpty
          size="s"
          color="danger"
          onClick={logout}
          iconType="kqlFunction"
          iconSide="right"
        >
          <EuiI18n token="logout" default="Logout" />
        </EuiButtonEmpty>
      </EuiFormRow>
    </Fragment>
  )
}

export default Logout
