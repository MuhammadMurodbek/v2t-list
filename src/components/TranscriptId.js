import React, { Fragment } from 'react'
import { EuiFormRow, EuiButtonEmpty } from '@elastic/eui'
import swal from 'sweetalert'
import { EuiI18n } from '@elastic/eui'

const TranscriptId = ({ id }) => {
  const copyToClipBoard = () => {
    navigator.permissions.query({ name: 'clipboard-write' }).then((result) => {
      if (result.state === 'granted' || result.state === 'prompt') {
        /* write to the clipboard now */
        navigator.clipboard.writeText(id).then(
          function () {
            /* clipboard successfully set */
            swal({
              title: 'ID är kopierat till klippbordet',
              text: '',
              icon: 'info',
              button: 'Ok'
            })
          },
          function () {
            /* clipboard write failed */
            swal({
              title:
                'Web browsern stöds inte, använd t ex Chrome eller Firefox',
              text: '',
              icon: 'info',
              button: 'Ok'
            })
          }
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
