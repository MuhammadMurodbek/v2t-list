import React, {Fragment} from 'react'
import { EuiSpacer, EuiFormRow, EuiButtonEmpty } from '@elastic/eui'

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
          iconSide="right">
          Logga ut
        </EuiButtonEmpty>
      </EuiFormRow>
    </Fragment>
  )
}
      
export default Logout