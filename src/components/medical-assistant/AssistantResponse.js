/* eslint-disable max-len */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import {
  EuiText,
  EuiBasicTable,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  RIGHT_ALIGNMENT
} from '@inoviaab/eui'
import Disease from './Disease'
import ICDParams from './ICDParams'
import MedicalAssistantRowHeader from './MedicalAssistantRowHeader'
import MedicalAssistantTitle from './MedicalAssistantTitle'

const AssistantResponse = ({
  data,
  updateValue,
  selectedDisease,
  rerunMedicalAssistant,
  expandedObj
}) => {
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState(expandedObj)
  useEffect(() => {
    if (data[0]) {
      if (data[0].isInteractive) {
        setItemIdToExpandedRowMap(expandedObj)
      }
    }
  }, [data])
  const icdCodePresents = (diseases) => {
    let totalCodes = 0
    diseases.forEach(
      (disease) => (totalCodes += Object.keys(disease.icdCodes).length)
    )
    diseases.forEach(
      (disease) =>
        (totalCodes += Object.keys(disease.additionalIcdCodes).length)
    )
    return totalCodes > 0
  }

  const tableData = data
    ? data
      .filter((d) => d.parameters.length)
      .map((disease, i) => {
        let indexValue = i
        data.forEach((d, j) => {
          if (d.name === disease.name) {
            indexValue = j
          }
        })
        return { name: disease.name, id: indexValue }
      })
    : []

  if (icdCodePresents(data)) {
    tableData.push({ name: 'ICD-10', id: 10000 })
  }

  const spreadColumns = (item) => {
    let itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap }
    const { name, id } = item
    selectedDisease(item.name)
    if (itemIdToExpandedRowMapValues[item.name]) {
      delete itemIdToExpandedRowMapValues[item.name]
    } else {
      itemIdToExpandedRowMapValues = {}
      itemIdToExpandedRowMapValues[name] =
        id === 10000 ? (
          <ICDParams updateValue={updateValue} />
        ) : (
          <Disease id={id} updateValue={updateValue} />
        )
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues)
  }

  const columns = [
    {
      align: RIGHT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      render: (item) => (
        <EuiButtonIcon
          aria-label="expand"
          onClick={() => spreadColumns(item)}
          iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
        />
      )
    },
    {
      field: 'name',
      name: '',
      truncateText: true,
      render: (item) =>
        item === 'ICD-10' ? (
          <EuiText>
            <span className="medicalAssistant">{item}</span>
          </EuiText>
        ) : (
          <MedicalAssistantRowHeader item={item} data={data} />
        )
    }
  ]

  const getRowProps = (item) => {
    const { id } = item
    return {
      'data-test-subj': `disease-${id}`,
      className: 'customRowClass',
      onClick: () => {}
    }
  }

  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiText>
          <label className="euiFormLabel">
            <MedicalAssistantTitle />
          </label>
          <EuiButtonIcon
            aria-label="Expand"
            iconType="refresh"
            onClick={() => {
              rerunMedicalAssistant(false)
            }}
          />
        </EuiText>
        <EuiBasicTable
          columns={columns}
          items={tableData}
          itemId="name"
          itemIdToExpandedRowMap={itemIdToExpandedRowMap}
          isExpandable={true}
          rowProps={getRowProps}
          compressed={true}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}

export default AssistantResponse
