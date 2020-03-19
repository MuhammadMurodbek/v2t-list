import React, { Fragment } from 'react'
import { EuiFormRow, EuiButtonEmpty } from '@elastic/eui'
import swal from 'sweetalert'

const TranscriptId = ({ id }) => {
  const copyToClipBoard = () => {
    navigator.permissions.query({ name: "clipboard-write" }).then(result => {
      if (result.state === "granted" || result.state === "prompt") {
        /* write to the clipboard now */
        navigator.clipboard.writeText(id).then(function () {
          /* clipboard successfully set */
          swal({
            title: 'id is copied to clipboard',
            text: '',
            icon: 'info',
            button: 'Ok'
          })
        }, function () {
          /* clipboard write failed */
          swal({
            title: 'The browser is not supported',
            text: '',
            icon: 'info',
            button: 'Ok'
          })
        })
      }
    })
    
  }

  return (
    <Fragment>
      <EuiFormRow label="" display="center">  
        <EuiButtonEmpty
          size="s"
          color="primary"
          onClick={copyToClipBoard}
        >
          {id}
        </EuiButtonEmpty>  
      </EuiFormRow>
    </Fragment>
  )
}

export default TranscriptId