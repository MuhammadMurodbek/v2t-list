/* eslint-disable no-console */
const getKeyByValue = (object, value) => 
  Object.keys(object).filter(k => object[k].map(p => p.toUpperCase()).includes(value.toUpperCase()))[0] || false
  // Object
  //   .keys(object)
  //   .filter(k => object[k].includes(value))[0] || false

const getTheFullKeyWords = (partialKeyword, listOfKeywords) => {
  const probableKeywords = []
  listOfKeywords.map(keyword=>{
    if (keyword.includes(partialKeyword.toUpperCase())) {
      probableKeywords.push(keyword)
    }
  })  
  return probableKeywords
}


const isItAValidKeyword = (listOfProbableKeywords, finalText, i) => {
  // console.log('listOfProbableKeywords')
  // console.log(listOfProbableKeywords)
  // console.log('finalText')
  // console.log(finalText)
  // console.log('i')
  // console.log(i)
  const splittedFinalText = finalText.split(' ').map(word=> word.toUpperCase())
  let matchedKeyword = null
  listOfProbableKeywords.forEach((probableKeyword) => {
    const splittedByWord = probableKeyword.split(' ')
    let numberOfMatches = 0
    for (let j = 0; j <= splittedByWord.length-1; j++) {
      // console.log(`j=${j}`)
      if (splittedByWord[j] === splittedFinalText[i+j]) {
        // console.log('match')
        numberOfMatches += 1
        // console.log(splittedFinalText[i + j])
        // console.log('match end')
      }
      if (numberOfMatches === splittedByWord.length) {
        // console.log('mooo')
        matchedKeyword = probableKeyword
      }
    }
  })
  // console.log("###########")
  // console.log("###########")
  // console.log(matchedKeyword)
  // console.log("###########")
  if (matchedKeyword) return {status: true, section: matchedKeyword}
  else return { status: false }
}

const processChapters = (finalText, updatedSections) => {  
  const usedKeywords = ['KONTAKTORSAK']
  const words = finalText.split(' ')
  const tempChapters = [{ 
    keyword: 'KONTAKTORSAK',
    segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
  }]
  // console.log('updatedSections')
  // console.log(updatedSections)

  for (let i = 0; i <= words.length - 1; i++) {
    // If the current word is a section header/ or substring of a 
    // section header and never used as a keyword
    // if (Object.keys(updatedSections).includes(word.toUpperCase()) 
    if (words[i].trim().length > 0) {
    
    if (
      Object
        .keys(updatedSections)
        .map(section => section.toUpperCase())
        .map(key => key.includes(words[i].toUpperCase()))
        .includes(true)
      // check if the word is a used keyword or subset of a used keyword  
      && !usedKeywords
        .map(keyword => keyword.toUpperCase().includes(words[i].toUpperCase()))
        .includes(true)
    ) {
      // console.log('potential keyword')
      // console.log(words[i])
      // check if it is a full keyword
      if(Object
        .keys(updatedSections)
        .map(section => section.toUpperCase())
        .includes(words[i].toUpperCase())) {
        // console.log('being a full keyword')
        console.log('ppp')
        console.log(words[i])
        console.log('ppp end')
        tempChapters.push({
          keyword: words[i].toUpperCase(),
          segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
        })
        
        usedKeywords.push(words[i].toUpperCase())
      } else {
        // console.log('Partial keyword found')
        // console.log(word)
        const listOfProbableKeywords = getTheFullKeyWords(words[i], 
          Object
            .keys(updatedSections)
            .map(section => section.toUpperCase()),
          i, finalText  
        )
        // console.log('listOfProbableKeywords')
        // console.log(listOfProbableKeywords)
        // Check if the keywords are present
        const isKeywordPresent 
          = isItAValidKeyword(listOfProbableKeywords, finalText, i)
        // console.log('isKeywordPresent')
        
        if(isKeywordPresent.status) {
          const matchedSectionHeader = isKeywordPresent.section.toUpperCase()
          console.log('ppp matchedSectionHeader')
          console.log(words[i])
          console.log(matchedSectionHeader)
          console.log('ppp end')
          if(matchedSectionHeader) {
            tempChapters.push({
              keyword: matchedSectionHeader,
              segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
            })
            usedKeywords.push(matchedSectionHeader)
            i += matchedSectionHeader.split(' ').length - 1
          }
          

        } else if(
          // words[i] belongs to a synonym
          Object
            .keys(updatedSections)
            .map(sectionKey => updatedSections[sectionKey])
            .flat().map(v => v.toUpperCase())
            .map(key => key.includes(words[i].toUpperCase()))
            .includes(true)
          && !usedKeywords
            .map(keyword => keyword.toUpperCase().includes(words[i].toUpperCase()))
            .includes(true)
        ) {
          const listOfProbableSynonyms = getTheFullKeyWords(words[i],
            Object
              .keys(updatedSections)
              .map(sectionKey => updatedSections[sectionKey])
              .flat().map(v => v.toUpperCase()),
            i, finalText
          )
          const isSynonymPresent
            = isItAValidKeyword(listOfProbableSynonyms, finalText, i)
          // console.log(isSynonymPresent)
          // console.log('*******')
          // console.log('*******')
          // console.log('*******')
          // console.log(words[i])
          // console.log(listOfProbableSynonyms)
          // console.log('*******')
          // console.log('*******')
          // console.log('*******')
          // if it is a synonym then
          if(isSynonymPresent.status) {
            // console.log('updatedSections')
            // console.log(updatedSections)
            // console.log('isSynonymPresent.section')
            // console.log(isSynonymPresent.section)
            const matchedSectionHeader = getKeyByValue(updatedSections, isSynonymPresent.section)
            
            // console.log('matchedSectionHeader')
            // console.log(matchedSectionHeader)
            console.log('ppp matchedSectionHeader')
            console.log(words[i])
            console.log(matchedSectionHeader)
            console.log('ppp end')
            if (matchedSectionHeader) {
              tempChapters.push({
                keyword: matchedSectionHeader,
                segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
              })
              usedKeywords.push(matchedSectionHeader)
              i += matchedSectionHeader.split(' ').length - 1
            }
            
          } else {
            if (words[i] === '\n') {
              tempChapters[tempChapters.length - 1].segments[0].words
                = `${tempChapters[tempChapters.length - 1].segments[0].words} `
            } else {
              tempChapters[tempChapters.length - 1].segments[0].words
                = `${tempChapters[tempChapters.length - 1]
                  .segments[0].words} ${words[i]}`
            }
          }
              


            //else 
            /* else {
              
            } */
        }
        else {
          if (words[i] === '\n') {
            tempChapters[tempChapters.length - 1].segments[0].words
              = `${tempChapters[tempChapters.length - 1].segments[0].words} `
          } else {
            tempChapters[tempChapters.length - 1].segments[0].words
              = `${tempChapters[tempChapters.length - 1]
                .segments[0].words} ${words[i]}`
          }
        }
      }

   
      // If the word is a synonym of a section header
      // and never used as a keyword
    } else if (
      Object
        .keys(updatedSections)
        .map(sectionKey => updatedSections[sectionKey])
        .flat().map(v => v.toUpperCase())
        .map(key => key.includes(words[i].toUpperCase()))
        .includes(true)
      && !usedKeywords
        .map(keyword => keyword.toUpperCase().includes(words[i].toUpperCase()))
        .includes(true)
    ) {        


      // check if the word itself is a synonym
      console.log('synonym vila')
      console.log(words[i])
      
      
      const synonymedKey = getKeyByValue(updatedSections, words[i])
      console.log('synonymedKey')
      console.log(synonymedKey)
      if (synonymedKey) {
        tempChapters.push({
          keyword: synonymedKey,
          segments: [{ words: '', startTime: 0.00, endTime: 0.00 }]
        })
        usedKeywords.push(synonymedKey)
      } else {

        if (words[i] === '\n') {
          tempChapters[tempChapters.length - 1].segments[0].words
            = `${tempChapters[tempChapters.length - 1].segments[0].words} `
        } else {
          tempChapters[tempChapters.length - 1].segments[0].words
            = `${tempChapters[tempChapters.length - 1].segments[0].words} ${words[i]}`
        }

      }
      





    } else {
      if (words[i] === '\n') {
        tempChapters[tempChapters.length - 1].segments[0].words
          = `${tempChapters[tempChapters.length - 1].segments[0].words} `
      } else {
        tempChapters[tempChapters.length - 1].segments[0].words
          = `${tempChapters[tempChapters.length - 1].segments[0].words} ${words[i]}`
      }
    }
  }
  }
  return tempChapters
}

export default processChapters
