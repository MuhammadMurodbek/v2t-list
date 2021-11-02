/* eslint-disable max-len */
const getTheDiff = (chapters, updatedValue) => {
  let diff = updatedValue
    .map((updatedParameters) => updatedParameters.parameters.values)
    .map(parameters => parameters.filter(param => param.status === true))
    .filter(result => result.length > 0)
    .map((q) => q.map((r) => r.name))
    .join(', ')

  diff = diff.replace(',', '')
  chapters[0].segments.forEach((segment) => {
    if (diff.includes(segment.words.trim())) {
      // get the remaining part
      diff = diff.replace(segment.words, '')
      diff = diff.replace(',', '')
    }
  })

  return diff
}


const parseMedicalAssistantData = (serverData, transcriptText, isInteractive) => {
  const diseases = []
  serverData.diseases.forEach((disease) => {
    const parameters = []
    const icdCodes = []
    const additionalIcdCodes = []
    
    Object.keys(disease.parameters).forEach(parameterName => {
      parameters.push({
        name: parameterName,
        values: disease.parameters[parameterName].map(param => {
          return {
            name: param,
            status: false
          }
        })
      })
    })
        
    Object.keys(disease.icdCodeMap).forEach((icdKey) => {
      // check icd code in the text
      const pattern = icdKey.toLowerCase()
      const patternRegex =  new RegExp(pattern, 'g')
      let icdSelectedStatus = false
      if (transcriptText.toLowerCase().match(patternRegex)) {
        icdSelectedStatus = true
      }
      icdCodes.push({
        value: icdKey,
        description: disease.icdCodeMap[icdKey],
        selectedStatus: icdSelectedStatus
      })
    })
        
    Object.keys(disease.additionalCodesMap).forEach((additionalKey) => {
      const pattern = additionalKey.toLowerCase()
      const patternRegex = new RegExp(pattern, 'g')
      let additionalIcdSelectedStatus = false
      if (transcriptText.toLowerCase().match(patternRegex)) {
        additionalIcdSelectedStatus = true
      }
      additionalIcdCodes.push({
        value: additionalKey,
        description: disease.additionalCodesMap[additionalKey],
        selectedStatus: additionalIcdSelectedStatus
      })
    })

    const codingSupportStatus = localStorage.getItem('codingSupportStatus')
    const medicalAssistantStatus = localStorage.getItem('medicalAssistantStatus')

    if (codingSupportStatus==='true') {  
      if (disease.basedOnSymptom === false) {
        diseases.push({
          name: disease.name[0],
          foundAtIndex: disease.foundAtIndex,
          nameFoundInContent: disease.nameFoundInContent,
          parameters: [],
          icdCodes,
          additionalIcdCodes,
          basedOnSymptom: disease.basedOnSymptom,
          isInteractive: false
        })
      }
    } else if (medicalAssistantStatus==='true') {
      if(disease.basedOnSymptom===false)  {
        diseases.push({
          name: disease.name[0],
          foundAtIndex: disease.foundAtIndex,
          nameFoundInContent: disease.nameFoundInContent,
          parameters,
          icdCodes,
          additionalIcdCodes,
          basedOnSymptom: disease.basedOnSymptom,
          isInteractive
        })  
      }
    } else {
      diseases.push({
        name: disease.name[0],
        foundAtIndex: disease.foundAtIndex,
        nameFoundInContent: disease.nameFoundInContent,
        parameters,
        icdCodes,
        additionalIcdCodes,
        basedOnSymptom: disease.basedOnSymptom,
        isInteractive
      })
    }
  })
  return diseases
}

const getTranscriptInPlainText = (chapters) => {
  let chapterText = chapters
    .map((chapter) => chapter.segments.map((segment) => segment.words)).flat()
  chapterText = [...chapterText].join(' ')
  return chapterText
}

const highlightSelectedDisease = (diseaseName, chapters, assistanceData) => {
  const indexValue = assistanceData
    .filter(disease => disease.name === diseaseName)[0]
    .foundAtIndex
  // console.log('indexValue', indexValue)
  const nameFoundInContent = assistanceData
    .filter(disease => disease.name === diseaseName)[0]
    .nameFoundInContent.trim()
  // console.log('nameFoundInContent', nameFoundInContent)
  let matchedTextStack = ''
  let offsetId = 0
  const finalListOfSegments = []
  let temporarySegments = []
  let indexCount = 0
  chapters.forEach((chapter, i) => {
    chapter.segments.forEach((segment, j) => {
      indexCount += segment.words.trim().split(' ').length
      for (let wordsIterator = 0; wordsIterator<segment.words.length;wordsIterator += 1) {
        if (nameFoundInContent[offsetId] === segment.words[wordsIterator].toLowerCase()) {
          matchedTextStack = `${matchedTextStack}${segment.words[wordsIterator]}`
          offsetId += 1
          temporarySegments.push({
            chapterId: i, 
            segmentId: j, 
            diffBetweenIndexCountAndIndexValue: Math.abs(indexCount-indexValue) 
          })

          if(matchedTextStack.trim().toLowerCase()===nameFoundInContent.trim()
          // && indexCount - indexValue < 3 // check for a better mechanism for remove duplication
          ) // bingo
          {
            matchedTextStack = ''
            finalListOfSegments.push(...temporarySegments)
            temporarySegments = []
          }
        } else {
          matchedTextStack = ''
          temporarySegments = []
          offsetId = 0
        }
      }
    })
  })
  
  const uniqueFinalSetOfSegments = removeDuplicates(finalListOfSegments)
  // use the only uniqe final segments where the 
  // diff between index value and the index count is the minimum


  const minimumDiffsBetweenIndex = uniqueFinalSetOfSegments
    .map(uniqueFinalSetOfSegment => uniqueFinalSetOfSegment.diffBetweenIndexCountAndIndexValue)
  const minimumDiff = Math.min(...minimumDiffsBetweenIndex)

  const selectedUniqueFinalSetOfSegments = uniqueFinalSetOfSegments
    .filter(uniqueFinalSetOfSegment => uniqueFinalSetOfSegment.diffBetweenIndexCountAndIndexValue === minimumDiff)

  // Add consecutive segments if available
  const finalSegmentWithConsecutiveSegments = []
  if(selectedUniqueFinalSetOfSegments.length>0){
    const minimumIndexValue = selectedUniqueFinalSetOfSegments[0].diffBetweenIndexCountAndIndexValue
    uniqueFinalSetOfSegments.forEach((segment)=>{
      if (segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue // fix this code
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 1 && selectedUniqueFinalSetOfSegments.length<=2
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 2 && selectedUniqueFinalSetOfSegments.length <= 3
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 3 && selectedUniqueFinalSetOfSegments.length <= 4
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 4 && selectedUniqueFinalSetOfSegments.length <= 5
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 5 && selectedUniqueFinalSetOfSegments.length <= 6
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 6 && selectedUniqueFinalSetOfSegments.length <= 7
        || segment.diffBetweenIndexCountAndIndexValue === minimumIndexValue + 7 && selectedUniqueFinalSetOfSegments.length <= 8
      ) {
        finalSegmentWithConsecutiveSegments.push(segment)
      }
    })
  }
  
  return finalSegmentWithConsecutiveSegments
}

const removeDuplicates = (originalArray) => {
  var newArray = []
  originalArray.forEach((arr) => {
    let matched = false
    newArray.forEach(narray => {
      if (narray.chapterId === arr.chapterId && narray.segmentId === arr.segmentId) { matched = true }
    })
    if (!matched) newArray.push(arr)
  })
  return newArray
}


export default {
  getTheDiff,
  parseMedicalAssistantData, 
  getTranscriptInPlainText,
  highlightSelectedDisease
}