/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import {
  EuiCheckboxGroup,
  EuiText,
  EuiButtonIcon,
  EuiSpacer,
  RIGHT_ALIGNMENT
} from '@patronum/eui'
import { ParamOptionsMultiple } from './ParamOptionsMultiple'
import '../../styles/tags.css'

const ParamOptions = ({
  info,
  selectedDisease,
  selectedParameters,
  updateParams,
  fullData,
  nameFoundInContent,
  basedOnSymptom
}) => {
  const [toggleIdToSelectedMap, setToggleIdToSelectedMap] = useState(
    selectedParameters
  )
  const radios = info.values.map((option) => {
    return {
      id: option.name,
      label: option.name
    }
  })

  const convertToUpdatedParam = (changedData) => {
    const updatedFullData = []
    fullData.forEach((parameterData) => {
      if (parameterData.name === info.name) {
        updatedFullData.push({
          disease: selectedDisease,
          nameFoundInContent: nameFoundInContent,
          parameters: {
            name: parameterData.name,
            values: Object.keys(changedData).map((value) => {
              return { name: value, status: changedData[value] }
            })
          },
          basedOnSymptom: basedOnSymptom
        })
      } else {
        updatedFullData.push({
          disease: selectedDisease,
          nameFoundInContent: nameFoundInContent,
          parameters: parameterData,
          basedOnSymptom: basedOnSymptom
        })
      }
    })

    return updatedFullData
  }

  const onChangeMulti = (optionId) => {
    // console.log('optionId', optionId)
    const newToggleIdToSelectedMap = {
      ...toggleIdToSelectedMap,
      ...{
        [optionId]: !toggleIdToSelectedMap[optionId]
      }
    }

    updateParams(convertToUpdatedParam(newToggleIdToSelectedMap))
    setToggleIdToSelectedMap(newToggleIdToSelectedMap)
    // console.log('toggleIdToSelectedMap', toggleIdToSelectedMap)
    // console.log('newToggleIdToSelectedMap', newToggleIdToSelectedMap)
  }

  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({})

  const tableData = [{ name: info.name, id: 10011 }]

  const spreadColumns = (item) => {
    let itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap }
    const { name, id } = item
    if (itemIdToExpandedRowMapValues[item.name]) {
      delete itemIdToExpandedRowMapValues[item.name]
    } else {
      itemIdToExpandedRowMapValues = {}
      itemIdToExpandedRowMapValues[name] = (
        <ParamOptionsMultiple
          info={info}
          selectedDisease={selectedDisease}
          selectedParameters={selectedParameters}
          updateParams={updateParams}
          fullData={fullData}
          nameFoundInContent={nameFoundInContent}
          basedOnSymptom={basedOnSymptom}
        />
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
      render: (item) => (
        <EuiText>
          <span className="medicalAssistant">{item}</span>
        </EuiText>
      )
    }
  ]

  return (
    <>
      <div className="parametersCheckbox">
        <span className="medicalAssistant">{info.name}&nbsp;&nbsp;&nbsp;</span>
        <EuiCheckboxGroup
          style={{ textAlign: 'left' }}
          options={radios}
          idToSelectedMap={toggleIdToSelectedMap}
          onChange={(id) => onChangeMulti(id)}
        />
      </div>
      <EuiSpacer size="m" />
    </>
  )
}
export default ParamOptions
