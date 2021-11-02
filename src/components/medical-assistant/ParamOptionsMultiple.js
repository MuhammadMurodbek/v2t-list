/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { EuiCheckboxGroup } from '@patronum/eui'

export const ParamOptionsMultiple = ({
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
    console.log('optionId', optionId)
    const newToggleIdToSelectedMap = {
      ...toggleIdToSelectedMap,
      ...{
        [optionId]: !toggleIdToSelectedMap[optionId]
      }
    }

    updateParams(convertToUpdatedParam(newToggleIdToSelectedMap))
    setToggleIdToSelectedMap(newToggleIdToSelectedMap)
    console.log('toggleIdToSelectedMap', toggleIdToSelectedMap)
    console.log('newToggleIdToSelectedMap', newToggleIdToSelectedMap)
  }

  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({})

  return (
    <EuiCheckboxGroup
      style={{ textAlign: 'left', paddingLeft: '5px' }}
      options={radios}
      idToSelectedMap={toggleIdToSelectedMap}
      onChange={(id) => onChangeMulti(id)}
    />
  )
}
