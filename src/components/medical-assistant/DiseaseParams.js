

/* eslint-disable react/prop-types */
/* eslint-disable max-len */
import React from 'react'
import ParamOptions from './ParamOptions'


const DiseaseParams = ({ parameters, selectedDisease, updateParams, nameFoundInContent, basedOnSymptom }) => {
  const labels = parameters.map((param, indexValue) => {
    const selectedParameters = {}
    param['values'].forEach(value=>{selectedParameters[value.name] = value.status})  

    return (        
      <div key={`${selectedDisease}-${indexValue}`}>
        <ParamOptions
          info={param}
          selectedDisease={selectedDisease}
          selectedParameters={selectedParameters} 
          updateParams={updateParams}
          fullData={parameters}
          nameFoundInContent={nameFoundInContent}
          basedOnSymptom={basedOnSymptom}
        />
      </div>
    )
  })

  
  return (<>
    {labels}
  </>)
}

export default DiseaseParams