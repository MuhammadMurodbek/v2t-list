/* eslint-disable no-console */
import api from '../api'
import { CODE_NAMESPACES } from '../components/Tags'

const processTagsLive = (text, existingTags, onUpdateTags) => {
  // Check regex letter and three numbers
  const machedPatterns = text.match(/\b([a-zA-Z] *[a-zA-Z]{0,1} *\d *(\.|\,)? *\d *(\.|\,)?\d)\b/g)
  if (machedPatterns) { 
    
    // if matched patters is not duplicate
    const matchedPatternsTrimmed = machedPatterns.map(matchedPattern => matchedPattern.replace(/\s+/g, '').trim().toLowerCase())
    const previousIcdCodes = []
    existingTags.icd10Codes.forEach(tg => {
      previousIcdCodes.push(tg)
    })

    const currentTags = { icd10Codes: previousIcdCodes }

    matchedPatternsTrimmed.forEach(async(pattern)=>{
      const code = await loadICD10Codes(pattern)
      if(code) {
        if (code.length > 0)
          if (code[0].value) {
            const currentTagValues = currentTags.icd10Codes.map(v => v.value)
            if (!currentTagValues.includes(code[0].value))
              currentTags.icd10Codes.push({ value: code[0].value, description: code[0].description })
          }
      }
    })
    onUpdateTags(currentTags)
  }
}

const loadICD10Codes = async (pattern) => {
  const codes = []
  const codeData = await api.keywordsSearch(pattern, CODE_NAMESPACES['icd10Codes'])
  if (codeData)
    if (codeData.data && codeData.data.length > 0) {
      const finalTag = codeData.data.filter(tagValue => tagValue.value.trim().toLowerCase() === pattern.replace(/\s+/g, '').toLowerCase())
      if (finalTag) {
        if (finalTag[0].value && finalTag[0].description)
          codes.push({ value: finalTag[0].value, description: finalTag[0].description })
      } 
    }
  return codes
}

export default processTagsLive
