/* eslint-disable max-len */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { EuiToolTip } from '@elastic/eui'
import React from 'react'
import '../../styles/tags.css'

const ICDCheckbox = ({ data, handleInputChange, assistanceData }) => {
  const updatedData = (checkboxStatus) => {
    const updatedCheckbox = data.codes.map(obj => {
      if (obj.value === checkboxStatus.target.value) {
        return { ...obj, selectedStatus: checkboxStatus.target.checked }
      } else {
        return obj
      }
    })
    handleInputChange(updatedCheckbox, data.name, data.type, assistanceData)
  }

  const getFormattedCode = (str) => {
    const charLimit = 45
    const subStrings = []
    let tempStr = ''
    for(let i=0;i<str.length;i+=1) {
      tempStr = `${tempStr}${str[i]}`
      if(i%charLimit===0&& i!==0) {
        tempStr = `${tempStr}... `
        break
      }
    }
    subStrings.push(tempStr)
    return <>{subStrings.map((substr, i)=>(<span key ={i}>{substr}<br /></span>))}</>
  }

  const ShowTheData = ({ icdInfo }) => {
    return icdInfo.map((obj, i)=>{
      return (
        <div key={i} style={{ display: 'table-caption' }}>
          <EuiToolTip
            position="left"
            content={`${obj.value}: ${obj.description}`}
          >
            <label key={i} style={{ lineHeight: 1.5 }}>
              <input
                key={i}
                className="icdCheckBox"
                name="isGoing"
                type="checkbox"
                checked={obj.selectedStatus}
                onChange={updatedData}
                value={obj.value}
              />
                &nbsp;{' '}
              <span className="medicalAssistant">
                <strong>{obj.value}</strong>:&nbsp;
              </span>
              <span className="firstLetterUpperCase medicalAssistant">
                {getFormattedCode(obj.description)}
              </span>
            </label>
          </EuiToolTip>
        </div>
      )
    })
  }

  return <ShowTheData icdInfo={data.codes}/>
}

export default ICDCheckbox
