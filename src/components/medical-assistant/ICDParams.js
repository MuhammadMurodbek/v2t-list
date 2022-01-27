/* eslint-disable max-len */
/* eslint-disable react/prop-types */
import React from 'react'
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiTextAlign,
  EuiSpacer,
  EuiText,
  EuiI18n
} from '@inoviaab/eui'
import MedicalAssistantContext from '../../context/MedicalAssistantContext'
import ICDCheckbox from './ICDCheckbox'

const ICDParams = ({ updateValue }) => {
  const handleInputChange = (
    updatedCheckbox,
    diseaseName,
    type,
    assistanceData
  ) => {
    const updatedData = []
    if (type === 'icdCodes') {
      assistanceData.forEach((disease) => {
        if (disease.name === diseaseName) {
          updatedData.push({ ...disease, icdCodes: updatedCheckbox })
        } else {
          updatedData.push({ ...disease })
        }
      })
    } else if (type === 'additionalIcdCodes') {
      assistanceData.forEach((disease) => {
        if (disease.name === diseaseName) {
          updatedData.push({ ...disease, additionalIcdCodes: updatedCheckbox })
        } else {
          updatedData.push({ ...disease })
        }
      })
    }
    updateValue(updatedData)
  }

  return (
    <MedicalAssistantContext.Consumer>
      {(assistanceData) => {
        const icdCodesFromAssistanceData = (diseaseName) =>
          assistanceData
            .filter((aData) => aData.name === diseaseName)
            .map((disease) => {
              return {
                name: disease.name,
                codes: disease.icdCodes,
                type: 'icdCodes'
              }
            })[0]

        const additionalIcdCodesFromAssistanceData = (diseaseName) =>
          assistanceData
            .filter((aData) => aData.name === diseaseName)
            .map((disease) => {
              return {
                name: disease.name,
                codes: disease.additionalIcdCodes,
                type: 'additionalIcdCodes'
              }
            })[0]

        return (
          <EuiFlexGroup>
            <EuiFlexItem>
              {assistanceData.map((param, index) => {
                return (
                  <div key={index}>
                    <EuiText>
                      <EuiTextAlign textAlign="left">
                        <span className="firstLetterUpperCase medicalAssistantTitle">
                          {param.name}&nbsp;&nbsp;&nbsp;
                        </span>

                        <EuiFlexGroup>
                          <EuiFlexItem className="icdCheckBox">
                            <ICDCheckbox
                              data={icdCodesFromAssistanceData(param.name)}
                              handleInputChange={handleInputChange}
                              assistanceData={assistanceData}
                            />
                            <EuiSpacer size="s" />
                            <EuiText
                              textAlign="left"
                              className="firstLetterUpperCase medicalAssistantTitle"
                            >
                              <span>
                                <EuiI18n
                                  token="additionaCode"
                                  default="Most used code(s) for"
                                />
                                &nbsp;{param.name}
                              </span>
                            </EuiText>
                            <ICDCheckbox
                              data={additionalIcdCodesFromAssistanceData(
                                param.name
                              )}
                              handleInputChange={handleInputChange}
                              assistanceData={assistanceData}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiTextAlign>
                    </EuiText>
                  </div>
                )
              })}
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      }}
    </MedicalAssistantContext.Consumer>
  )
}

export default ICDParams
