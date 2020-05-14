import React from 'react'
import { addGlobalToast } from './GlobalToastList'
import { EuiI18n } from '@elastic/eui'

const addErrorToast = (title = null, message = null) => {
  addGlobalToast(
    title ? title : <EuiI18n token="error" default="Error" />,
    <p>
      {message ? (
        message
      ) : (
        <EuiI18n token="unexpectedError" default="Unexpected error occurred" />
      )}
    </p>,
    'warning',
    'alert'
  )
}

export default addErrorToast
