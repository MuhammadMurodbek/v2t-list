// @ts-nocheck
/* eslint-disable prefer-template */
/* eslint-disable no-console */

const getCorrectKeyword = (keyword, updatedSections) => {
  const allTheKeywords = Object.keys(updatedSections)
  // Remaining task
  // use the values of the object to confirm as keyword
  // Remaining task
  // use the values of the object to confirm as keyword
  // Remaining task
  // use the values of the object to confirm as keyword
  // Remaining task
  // use the values of the object to confirm as keyword
  const keywords = allTheKeywords.map(section =>
    section.toUpperCase() === keyword.toUpperCase() ? section : ''
  )
  const correctCasedKeyword = keywords.filter(k => k.length > 0)[0]
  return correctCasedKeyword
}

const fixedCaseSections = (tempChapters, updatedSectionNames) => {
  return tempChapters.map(({ keyword, segments }) => {
    return {
      keyword: getCorrectKeyword(keyword, updatedSectionNames),
      segments
    }
  })
}

// const putPunkt = (str) =>
//   // match whether the last character of the string is a punctuation
//   !str.match(/[\p{P}\p{N}]$/u)
//     && str.length > 0 ? `${str}.` : str

// const setThePunkt = (tempChapters) => {
//   return tempChapters.map(({ keyword, segments }) => {
//     return {
//       keyword,
//       segments: [
//         {
//           words: putPunkt(segments.map(segment => segment.words).join()),
//           startTime: 0,
//           endTime: 0
//         }
//       ]
//     }
//   })
// }


// [{ "word": "H", "start": 0.56, "end": 1.1600000000000001 }, { "word": "4", "start": 1.94, "end": 2.22 }, { "word": "5", "start": 2.37, "end": 2.56 }][{ "word": "Hon", "start": 0.56, "end": 1.3 }, { "word": "4", "start": 1.94, "end": 2.22 }, { "word": "5", "start": 2.38, "end": 2.56 }]


const extractedText = (finalText) => {
//   if (finalText.trim() !== '1 1 1') {
  if (finalText.trim() !== '1 1 1') {
    // const output = 'const tempText = ' + finalText
    // var fn = new Function(output + ';return tempText;')
    // var result = fn()
    var outcome = restructureChapter(JSON.parse(finalText))
    // console.log('outcome')
    // console.log(outcome)
    // console.log('outcome end')
    return outcome
  } else {
    return [
      { words: 'KONTAKTORSAK', startTime: 0.0, endTime: 0.0 },
      { words: '.', startTime: 0.0, endTime: 0.0 },
      { words: '.', startTime: 0.0, endTime: 0.0 },
      { words: '.', startTime: 0.0, endTime: 0.0 }
    ]
  }
}

const restructureChapter = (data) => {
  if(data) {
    if(data.length>0) 
      return data.map(chapter => {
        return {
          words: chapter.word,
          startTime: chapter.start,
          endTime: chapter.end
        }
      })
    else return []
  }
  else return []

}

const processChaptersLive = (finalText, updatedSections, firstKeyword, cursorTime=2) => {
  const extractedFinalText = extractedText(finalText)
  console.log('updatedSections')
  console.log(updatedSections)
  console.log('updatedSections end')
  const sectionHeadersInLowerCase = Object.keys(updatedSections).map(sectionHeader => [`${sectionHeader.toLowerCase()}:`, sectionHeader.toLowerCase()]).flat()
  console.log('sectionHeadersInLowerCase')
  console.log(sectionHeadersInLowerCase)
  console.log('sectionHeadersInLowerCase end')
  const wordsOfTheChapter = extractedFinalText || []
  console.log('wordsOfTheChapter')
  console.log(wordsOfTheChapter)
  console.log('wordsOfTheChapter end')
  const usedSectionHeaders = []
  const newlyOrientedWords = []
  let latestKeyword = Object.keys(updatedSections)[0]
  wordsOfTheChapter.forEach((segment) => {
    if (
      sectionHeadersInLowerCase.includes(segment.words.trim().toLowerCase())
        && !usedSectionHeaders.includes(segment.words.trim().toLowerCase())
    ) {
      console.log('segment.words')
      console.log(segment.words)
      console.log('segment.words end')
      latestKeyword = segment.words.trim()
      if(segment.words[segment.words.length-1]===':') 
        latestKeyword = latestKeyword.slice(0, -1)
      
      usedSectionHeaders.push(segment.words.trim().toLowerCase())
    } else {
      newlyOrientedWords.push({
        keyword: latestKeyword,
        words: segment.words,
        startTime: segment.startTime,
        endTime: segment.endTime
      })
    }
  })

  const finalChapters = []
  
  let tempObject = { segments: [] }
  newlyOrientedWords.forEach((word, i) => {
    if (tempObject.keyword) {
      if (tempObject.keyword === word.keyword) {
        tempObject.segments.push({
          words: `${word.words} `, startTime: word.startTime, endTime: word.endTime
        })
      } else {
        finalChapters.push(tempObject)
        tempObject = { segments: [] }
        tempObject.keyword = word.keyword
        tempObject.segments.push({
          words: `${word.words} `, startTime: word.startTime, endTime: word.endTime
        })
      }
    } else {
      tempObject.keyword = word.keyword
      tempObject.segments.push({
        words: `${word.words} `, startTime: word.startTime, endTime: word.endTime
      }) 
    }
    if (i === newlyOrientedWords.length - 1)
      finalChapters.push(tempObject)
  })

  if (finalChapters.length===0) {
    finalChapters.push({
      keyword: 'KONTAKTORSAK',
      segments: [
        {words: '', startTime: 0.0, endTime: 0.0}
      ]
    })
  }

  // Fix the case of a section header as per backend data
  const fixedCase = fixedCaseSections(finalChapters, updatedSections)
  // Capitalize the transcript
  // const capitalized = capitalizeSections(fixedCase)
  // return capitalized
  // return capitalized ? setThePunkt(capitalized) : fixedCase
  // return tempChapters

  return fixedCase
}

export default processChaptersLive
