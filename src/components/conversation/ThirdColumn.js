import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  EuiFilePicker,
  EuiForm,
  EuiFormRow,
  EuiButtonEmpty,
  EuiButton,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiI18n,
  EuiFlexGroup,
  EuiFlexItem
} from '@patronum/eui'
import io from 'socket.io-client'

const ThirdColumn = ({ item, updateTranscription }) => {
  const socketio = io.connect('wss://ilxgpu1000.inoviaai.se/audio', {
    path: '/api/v1/diarization',
    transports: ['websocket']
  })
  const fileInputRef = useRef()
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState([])

  const openFlyout = () => {
    setIsFlyoutOpen(true)
  }
  const closeFlyout = () => {
    setIsFlyoutOpen(false)
  }
  const onFilesChange = (file) => {
    setFiles(file)
  }
  const onSubmit = () => {
    if (files.length === 0) {
      return
    }
    setUploading(true)
    const body = new FormData()
    body.append('media', files[0])
    const url = URL.createObjectURL(files[0])
    localStorage.setItem('fileSrc', url)
    socketio.emit('diarization-upload', files[0])
    socketio.on('upload-response', function (responseData) {
      updateTranscription(responseData)
      setUploading(false)
      closeFlyout()
    })
  }

  return item === '+Import files' ? (
    <>
      <EuiButtonEmpty onClick={openFlyout}>+Import files</EuiButtonEmpty>
      {isFlyoutOpen && (
        <EuiFlyout
          ownFocus
          style={{ width: '87vw' }}
          onClose={() => closeFlyout()}
          aria-labelledby="flyoutTitle"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2 id="flyoutTitle">Upload file</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction="column" gutterSize="xl">
              <EuiFlexItem grow={false}>
                <EuiForm>
                  <EuiFormRow
                    label={<EuiI18n token="uploadFile" default="Upload File" />}
                  >
                    <EuiFilePicker
                      ref={fileInputRef}
                      initialPromptText={
                        <EuiI18n token="uploadFile" default="Upload File" />
                      }
                      onChange={onFilesChange}
                    />
                  </EuiFormRow>
                </EuiForm>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiButton
                  fill
                  onClick={onSubmit}
                  isLoading={uploading}
                  style={{ width: 400 }}
                >
                  <EuiI18n token="upload" default="Upload" />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  ) : (
    <div>Template</div>
  )
}

ThirdColumn.propTypes = {
  item: PropTypes.string.isRequired,
  updateTranscription: PropTypes.func.isRequired
}

export default ThirdColumn
