import React from 'react'
import {
  EuiButton,
  EuiSwitch,
  EuiI18n
} from '@inoviaab/eui'
import PropTypes from 'prop-types'

const ApproveButtons = ({ item }) => {
  const approved = false
  const isUploadingMedia = false
  const onApprovedChange = () => {}
  const onSave = () => {}
  return item === 'approve' ? (
    <>
      <EuiSwitch
        label={
          <EuiI18n
            token="sendToCoWorker"
            default="Approve and send"
          />
        }
        checked={approved}
        onChange={onApprovedChange}
        id="approved_checkbox"
      />
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      <EuiButton
        size="s"
        fill
        isLoading={isUploadingMedia}
        onClick={onSave}
        id="save_changes"
      >
        Spara
      </EuiButton>
    </>
  ) : (
    <></>
  )
}

ApproveButtons.propTypes = {
  item: PropTypes.string
}

export default ApproveButtons
