import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  EuiButtonEmpty,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiInMemoryTable,
  EuiI18n,
  EuiFlexGroup,
  EuiFlexItem
} from '@inoviaab/eui'
// import SpeakerColumns from '../../constants/SpeakerColumns'
import Departments from '../../components/Departments'
import api from '../../api'
import { usePreferences } from '../PreferencesProvider'

const FirstColumn = ({ item, isListOpen, departments, selectTranscript }) => {
  const { preferences } = usePreferences()
  const history = useHistory()
  const [transcriptionId, setTranscriptionId] = useState(
    useParams().transcriptionId
  )
  const [departmentId, setDepartmentId] = useState(null)
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(isListOpen)
  const [transcripts, setTranscripts] = useState([])

  useEffect(() => {
    document.title = 'Inovia AI :: Conversations'
    if (transcriptionId) {
      setIsFlyoutOpen(false)
      loadSelectedTranscript(transcriptionId)
    }
    if (!departmentId && departments.length !== 0) {
      setDepartmentId(departments[0].id)
      loadTranscripts(departments[0].id, 0, departments[0].count)
    }
  }, [departments])
  const loadTranscripts = async (idOfDepartment, pageIndex, pageSize) => {
    const fetchedTranscripts = await api.loadTickets(
      idOfDepartment,
      pageIndex,
      pageSize
    )
    setTranscripts(fetchedTranscripts.data.items)
  }
  const openFlyout = () => {
    history.replace('/listOfTranscriptions')
    setIsFlyoutOpen(true)
  }
  const closeFlyout = () => {
    setIsFlyoutOpen(false)
    if (!transcriptionId) {
      history.replace('/transcriptor')
    } else {
      history.replace(`/transcriptor/${transcriptionId}`)
    }
  }
  const loadSelectedTranscript = (selectedTranscriptId) => {
    closeFlyout()
    selectTranscript(selectedTranscriptId)
    // change the url bar
    setTranscriptionId(selectedTranscriptId)
    history.replace(`/transcriptor/${selectedTranscriptId}`)
  }
  const columns = [
    ...preferences.columnsForTranscriptList,
    // ...SpeakerColumns,
    {
      label: <EuiI18n token="open" default="Open" />,
      field: 'id',
      name: '',
      width: '100px',
      render: (id) => (
        <EuiButtonEmpty onClick={() => loadSelectedTranscript(id)}>
          <EuiI18n token="open" default="Open" />
        </EuiButtonEmpty>
      ),
      disabled: true
    }
  ]

  const updateDepartmentId = (selectedDepartment) => {
    setDepartmentId(selectedDepartment)
    const size = departments.filter(
      (department) => department.id === selectedDepartment
    )[0].count
    loadTranscripts(selectedDepartment, 0, size)
  }

  const pagination = {
    totalItemCount: 150,
    pageSizeOptions: [10, 20, 50]
  }

  const renderedItem =
    item === 'listOfTranscriptions' ? (
      <>
        <EuiButtonEmpty onClick={openFlyout}>
          <span>
            <EuiI18n token="activityList" default="Transcription list" />
          </span>
        </EuiButtonEmpty>
        {isFlyoutOpen && (
          <EuiFlyout
            ownFocus
            style={{ width: '87vw' }}
            onClose={() => closeFlyout()}
            aria-labelledby="flyoutTitle"
          >
            <EuiFlyoutHeader hasBorder>
              <EuiTitle size="m">
                <h2 id="flyoutTitle">Transcription List</h2>
              </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
              <EuiFlexGroup direction="column" gutterSize="xl">
                {departmentId && (
                  <EuiFlexItem grow={false}>
                    <Departments
                      departments={departments}
                      departmentId={departmentId}
                      onUpdate={updateDepartmentId}
                    />
                  </EuiFlexItem>
                )}
                <EuiFlexItem>
                  <EuiInMemoryTable
                    items={transcripts}
                    columns={columns}
                    pagination={pagination}
                    noItemsMessage={
                      <h4
                        style={{
                          textAlign: 'center',
                          padding: '2em'
                        }}
                      >
                        Loading ...
                      </h4>
                    }
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlyoutBody>
          </EuiFlyout>
        )}
      </>
    ) : (
      <EuiButtonEmpty>
        <span>Title</span>
      </EuiButtonEmpty>
    )
  return renderedItem
}

export default FirstColumn
