const getKeyByValue = (object, value) => Object.keys(object).filter(k => object[k].includes(value))[0] || false

const processChapters = (finalText, updatedSections) => {  
  let usedKeywords = ["KONTAKTORSAK"]
  const words = finalText.split(' ')
    let tempChapters = [{ keyword: "KONTAKTORSAK", segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] }]
    words.forEach((word) => {
      // If the current word is a section header and never used as a keyword
      if (Object.keys(updatedSections).includes(word.toUpperCase()) 
        && !usedKeywords.includes(word.toUpperCase())
      ) {
        tempChapters.push({ keyword: word.toUpperCase(), segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
        usedKeywords.push(word.toUpperCase())

      // If the word is a synonym of a section header and never used as a keyword
      } else if (
        Object
          .keys(updatedSections)
          .map(sectionKey => updatedSections[sectionKey])
          .flat().map(v=>v.toUpperCase())
          .includes(word.toUpperCase())
        && !usedKeywords.includes(word.toUpperCase())
      ) {        
        const synonymedKey = getKeyByValue(updatedSections, word)
        tempChapters.push({ keyword: synonymedKey, segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
        usedKeywords.push(synonymedKey)
      } else {
        if (word === '\n') {
          tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words} `
         } else {
           tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words}  ${word}`
         }
      }
    })
  return tempChapters
}

export default processChapters
