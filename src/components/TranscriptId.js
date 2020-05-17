import React, { Fragment } from 'react'
import { EuiFormRow, EuiButtonEmpty } from '@elastic/eui'
import { EuiI18n } from '@elastic/eui'
import { addSuccessToast, addWarningToast } from './GlobalToastList'

const TranscriptId = ({ id }) => {
  const copyToClipBoard = () => {
    navigator.permissions.query({ name: 'clipboard-write' }).then((result) => {
      if (result.state === 'granted' || result.state === 'prompt') {
        /* write to the clipboard now */
        navigator.clipboard.writeText(id).then(
          () =>
            addSuccessToast(
              <EuiI18n token="success" default="Success" />,
              <EuiI18n
                token="idIsCopied"
                default="ID copied to the clipboard"
              />
            ),
          () =>
            addWarningToast(
              <EuiI18n token="warning" default="Warning" />,
              <EuiI18n
                token="browserIsNotSupported"
                default="Your browser is not supported, use e.g. Chrome or Firefox"
              />
            )
        )
      }
    })
  }

  return (
    <Fragment>
      <EuiFormRow label="" display="center">
        <EuiButtonEmpty size="s" color="primary" onClick={copyToClipBoard}>
          <EuiI18n
            token="clickToCopyDocumentId"
            default="Click to copy document ID"
          />
        </EuiButtonEmpty>
      </EuiFormRow>
    </Fragment>
  )
}

export default TranscriptId
