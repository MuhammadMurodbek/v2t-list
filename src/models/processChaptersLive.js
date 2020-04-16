// @ts-nocheck
/* eslint-disable prefer-template */
/* eslint-disable no-console */
// const getKeyByValue = (object, value) =>
//   Object
//     .keys(object)
//     .filter((k) =>
//       object[k]
//         .map(p => p.toUpperCase())
//         .includes(value.toUpperCase())
//     )[0] || false

// const getTheFullKeyWords = (partialKeyword, listOfKeywords) => {
//   const probableKeywords = []
//   listOfKeywords.forEach(keyword => {
//     if (keyword.includes(partialKeyword.toUpperCase())) {
//       probableKeywords.push(keyword)
//     }
//   })
//   return probableKeywords
// }

// const isItAValidKeyword = (listOfProbableKeywords, finalText, i) => {
//   const splittedFinalText = finalText.split(' ').map(word => word.toUpperCase())
//   let matchedKeyword = null
//   listOfProbableKeywords.forEach((probableKeyword) => {
//     const splittedByWord = probableKeyword.split(' ')
//     let numberOfMatches = 0
//     for (let j = 0; j <= splittedByWord.length - 1; j++) {
//       if (splittedByWord[j] === splittedFinalText[i + j]) {
//         numberOfMatches += 1
//       }
//       if (numberOfMatches === splittedByWord.length) {
//         matchedKeyword = probableKeyword
//       }
//     }
//   })
//   if (matchedKeyword) return { status: true, section: matchedKeyword }
//   else return { status: false }
// }

// const capitalize = (str) => str
//   .trim().charAt(0).toUpperCase() + str.trim().slice(1)

// const capitalizeSections = (tempChapters) => {
//   return tempChapters.map(({ keyword, segments }) => {
//     return {
//       keyword,
//       segments: [
//         {
//           words: capitalize(segments.map(segment => segment.words).join()),
//           startTime: 0,
//           endTime: 0
//         }
//       ]
//     }
//   })
// }

// const getCorrectKeyword = (keyword, updatedSections) => {
//   const allTheKeywords = Object.keys(updatedSections)
//   // Remaining task
//   // use the values of the object to confirm as keyword
//   // Remaining task
//   // use the values of the object to confirm as keyword
//   // Remaining task
//   // use the values of the object to confirm as keyword
//   // Remaining task
//   // use the values of the object to confirm as keyword
//   const keywords = allTheKeywords.map(section =>
//     section.toUpperCase() === keyword.toUpperCase() ? section : ''
//   )
//   const correctCasedKeyword = keywords.filter(k => k.length > 0)[0]
//   return correctCasedKeyword
// }

// const fixedCaseSections = (tempChapters, updatedSectionNames) => {
//   return tempChapters.map(({ keyword, segments }) => {
//     return {
//       keyword: getCorrectKeyword(keyword, updatedSectionNames),
//       segments
//     }
//   })
// }

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

const extractedText = (finalText) => {
//   if (finalText.trim() !== '1 1 1') {
  if (finalText.trim() !== '1 1 1') {
    const output = 'const tempText = ' + finalText
    var fn = new Function(output + ';return tempText;')
    var result = fn()
    var outcome = restructureChapter(result)
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
  if(data)
    return data.map(chapter => {
      return {
        words: chapter.word,
        startTime: chapter.start,
        endTime: chapter.end
      }
    })
  else return []

}

const processChaptersLive = (finalText, updatedSections, firstKeyword) => {
  console.log('finalTextqq')
  console.log(finalText)
  // const extractedFinalText = finalText
  const extractedFinalText = extractedText(finalText)
  console.log('extractedFinalText')
  console.log(extractedFinalText)
  console.log(extractedFinalText[0])
  console.log('updatedSections')
  console.log(updatedSections)  
  console.log('first keyword')  
  console.log(firstKeyword)  
  console.log('extractedFinalText end')
  // return extractedFinalText

  const sectionHeadersInLowerCase = Object.keys(updatedSections).map(sectionHeader => sectionHeader.toLowerCase())
  const wordsOfTheChapter = extractedFinalText || []
  const usedSectionHeaders = []
  const newlyOrientedWords = []
  let latestKeyword = Object.keys(updatedSections)[0]
  wordsOfTheChapter.forEach((segment) => {
    if (
      sectionHeadersInLowerCase.includes(segment.words.trim().toLowerCase())
        && !usedSectionHeaders.includes(segment.words.trim().toLowerCase())
    ) {
      latestKeyword = segment.words.trim()
      usedSectionHeaders.push(segment.words.trim().toLowerCase())
    } else {
      newlyOrientedWords.push({
        keyword: latestKeyword,
        words: segment.words.trim(),
        startTime: segment.startTime,
        endTime: segment.endTime
      })
    }
  })

  console.log('newlyOrientedWords')
  console.log(newlyOrientedWords)
  const finalChapters = []
  let tempObject = { segments: [] }
  newlyOrientedWords.forEach((word, i) => {
    if (tempObject.keyword) {
      if (tempObject.keyword === word.keyword) {
        tempObject.segments.push({
          words: `${word.words} `, startTime: word.startTime, endTime: word.endTime
        })
        if (i === newlyOrientedWords.length - 1) finalChapters.push(tempObject)
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
  })


  console.log('finalChapters')
  console.log(finalChapters)


return finalChapters
    // return [{ keyword: 'KONTAKTORSAK', segments: [{ words: '1 ', startTime: 0.0, endTime: 0.0 }, { words: '1 ', startTime: 0.0, endTime: 0.0 }, { words: '1 ', startTime: 0.0, endTime: 0.0 }] }]











//   // return extractedFinalText
//   let usedKeywords = ['Examination']
//   const words = finalText.split(' ')
//   const tempChapters = [{
//     keyword: firstKeyword,
//     segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
//   }]

//   for (let i = 0; i <= words.length - 1; i++) {
//     // If the current word is a section header/ or substring of a 
//     // section header and never used as a keyword
//     // if (words[i].trim().length > 0) {
//     if (words[i].length > 0) {
//       if (
//         Object
//           .keys(updatedSections)
//           .map(section => section.toUpperCase())
//           .map(key => key.includes(words[i].toUpperCase()))
//           .includes(true)
//         // check if the word is a used keyword or subset of a used keyword  
//         && !usedKeywords.map(
//           (keyword) => keyword.toUpperCase().includes(words[i].toUpperCase())
//         ).includes(true)
//       ) {
//       // check if it is a full keyword
//         if (Object
//           .keys(updatedSections)
//           .map(section => section.toUpperCase())
//           .includes(words[i].toUpperCase())) {
//           tempChapters.push({
//             // keyword: words[i].toUpperCase(),
//             keyword: words[i],
//             segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
//           })
//           // usedKeywords.push(words[i].toUpperCase())
//           usedKeywords.push(words[i])
//         } else {
//           const listOfProbableKeywords = getTheFullKeyWords(words[i],
//             Object
//               .keys(updatedSections)
//              .map(section => section.toUpperCase()),
//                         i, finalText)
//                     // Check if the keywords are present
//                     const isKeywordPresent
//                         = isItAValidKeyword(listOfProbableKeywords, finalText, i)

//                     if (isKeywordPresent.status) {
//                         const matchedSectionHeader = isKeywordPresent.section.toUpperCase()
//                         if (matchedSectionHeader) {
//                             tempChapters.push({
//                                 keyword: matchedSectionHeader,
//                                 segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
//                             })
//                             usedKeywords.push(matchedSectionHeader)
//                             i += matchedSectionHeader.split(' ').length - 1
//                         }
//                     } else if (
//                         // words[i] belongs to a synonym
//                         Object
//                             .keys(updatedSections)
//                             .map(sectionKey => updatedSections[sectionKey])
//                             .flat().map(v => v.toUpperCase())
//                             .map(key => key.includes(words[i].toUpperCase()))
//                             .includes(true)
//                         && !usedKeywords
//                             .map(
//                                 (keyword) => keyword
//                                     .toUpperCase().includes(words[i].toUpperCase())
//                             )
//                             .includes(true)
//                     ) {
//                         const listOfProbableSynonyms = getTheFullKeyWords(words[i],
//                             Object
//                                 .keys(updatedSections)
//                                 .map(sectionKey => updatedSections[sectionKey])
//                                 .flat().map(v => v.toUpperCase()),
//                             i, finalText
//                         )
//                         const isSynonymPresent
//                             = isItAValidKeyword(listOfProbableSynonyms, finalText, i)
//                         // if it is a synonym then
//                         if (isSynonymPresent.status) {
//                             const matchedSectionHeader
//                                 = getKeyByValue(updatedSections, isSynonymPresent.section)
//                             if (matchedSectionHeader) {
//                                 tempChapters.push({
//                                     keyword: matchedSectionHeader,
//                                     segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
//                                 })
//                                 usedKeywords.push(matchedSectionHeader)
//                                 i += matchedSectionHeader.split(' ').length - 1
//                             }
//                         } else {
//                             if (words[i] === '\n') {
//                                 tempChapters[tempChapters.length - 1].segments[0].words
//                                     = `${tempChapters[tempChapters.length - 1].segments[0].words}\n`
//                                 console.log('a')
//                             } else {
//                                 tempChapters[tempChapters.length - 1].segments[0].words
//                                     = `${tempChapters[tempChapters.length - 1]
//                                         .segments[0].words} ${words[i]}`
//                             }
//                         }
//                     } else {
//                         if (words[i] === '\n') {
//                             tempChapters[tempChapters.length - 1].segments[0].words
//                                 = `${tempChapters[tempChapters.length - 1].segments[0].words}\n`
//                             console.log('b')
//                         } else {
//                             tempChapters[tempChapters.length - 1].segments[0].words
//                                 = `${tempChapters[tempChapters.length - 1]
//                                     .segments[0].words} ${words[i]}`
//                         }
//                     }
//                 }
//                 // If the word is a synonym of a section header
//                 // and never used as a keyword
//             } else if (
//                 Object
//                     .keys(updatedSections)
//                     .map(sectionKey => updatedSections[sectionKey])
//                     .flat().map(v => v.toUpperCase())
//                     .map(key => key.includes(words[i].toUpperCase()))
//                     .includes(true)
//                 && !usedKeywords
//                     .map(keyword =>
//                         keyword.toUpperCase().includes(words[i].toUpperCase())
//                     )
//                     .includes(true)
//             ) {
//                 // check if the word itself is a synonym
//                 const synonymedKey = getKeyByValue(updatedSections, words[i])
//                 if (synonymedKey) {
//                     tempChapters.push({
//                         keyword: synonymedKey,
//                         segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
//                     })
//                     usedKeywords.push(synonymedKey)
//                 } else {
//                     if (words[i] === '\n') {
//                         tempChapters[tempChapters.length - 1].segments[0].words
//                             = `${tempChapters[tempChapters.length - 1].segments[0].words}\n`
//                         console.log('c')
//                     } else {
//                         tempChapters[tempChapters.length - 1].segments[0].words
//                             = `${tempChapters[tempChapters.length - 1]
//                                 .segments[0].words} ${words[i]}`
//                     }
//                 }
//             } else {
//                 if (words[i] === '\n') {
//                     tempChapters[tempChapters.length - 1].segments[0].words
//                         = `${tempChapters[tempChapters.length - 1].segments[0].words}\n`
//                     console.log('d')
//                 } else {
//                     tempChapters[tempChapters.length - 1].segments[0].words
//                         = `${tempChapters[tempChapters.length - 1]
//                             .segments[0].words} ${words[i]}`
//                 }
//             }
//         }
//     }

//     // Fix the case of a section header as per backend data
//     const fixedCase = fixedCaseSections(tempChapters, updatedSections)
//     // Capitalize the transcript
//     const capitalized = capitalizeSections(fixedCase)
//     return capitalized ? setThePunkt(capitalized) : tempChapters
//     // return tempChapters
}

export default processChaptersLive
