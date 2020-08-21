// @ts-nocheck
/* eslint-disable prefer-template */
/* eslint-disable no-console */
import parserUtils from '../models/live/parserUtils'
const processChaptersLive = (finalText, updatedSections, firstKeyword, cursorTime) => {
  const extractedFinalText = parserUtils.extractedText(finalText)
  // console.log('updatedSections')
  // console.log(updatedSections)
  // console.log('updatedSections end')
  const sectionHeaderOriginals = Object.keys(updatedSections).map(m => m.trim().toLowerCase())
  const sectionHeaderSynonyms = Object.values(updatedSections).flat().map(m => m.trim().toLowerCase())
  const sectionHeadersInLowerCase = [sectionHeaderOriginals, sectionHeaderSynonyms].flat()

  // console.log('sectionHeadersInLowerCase')
  // console.log(sectionHeadersInLowerCase)
  // console.log('sectionHeadersInLowerCase end')
  const wordsOfTheChapter = extractedFinalText || []
  // console.log('wordsOfTheChapter')
  // console.log(wordsOfTheChapter)
  // console.log('wordsOfTheChapter end')
  const usedSectionHeaders = []
  let newlyOrientedWords = []

  let latestKeyword = Object.keys(updatedSections)[0]
  wordsOfTheChapter.forEach((segment, i) => {
    if (
      sectionHeadersInLowerCase.includes(segment.words.trim().toLowerCase())
        && !usedSectionHeaders.includes(segment.words.trim().toLowerCase())
    ) {
      // Step 1 :: Check if the keyword is a synonym
      const candidateKeyword = segment.words.trim()
      const isTheKeywordASynonym = parserUtils.isKeywordSynonym(candidateKeyword, sectionHeaderOriginals)
      if (isTheKeywordASynonym) {
        latestKeyword = parserUtils.getTheKeywordFromSynonym(candidateKeyword, updatedSections)
      } else {
        latestKeyword = segment.words.trim()
      }

      // if (latestKeyword[latestKeyword.length-1]===':')
      //   latestKeyword = latestKeyword.slice(0, -1)

      usedSectionHeaders.push(segment.words.trim().toLowerCase())
    }
    // Search for multiple word keywords
    else if (!usedSectionHeaders.includes(segment.words.trim().toLowerCase())
      && i !== 0
      && parserUtils
        .isTheSegmentASectionHeader(
          sectionHeadersInLowerCase,
          usedSectionHeaders,
          segment.words.trim().toLowerCase(),
          wordsOfTheChapter[i-1].words.trim().toLowerCase()
        )
    ){
      const newKeyword = `${wordsOfTheChapter[i - 1].words.trim().toLocaleLowerCase()} ${segment.words.trim().toLocaleLowerCase()}`
      const previousKeyword = latestKeyword
      const candidateKeyword = newKeyword
      const isTheKeywordASynonym = parserUtils.isKeywordSynonym(candidateKeyword, sectionHeaderOriginals)
      // console.log('isKeywordSynonym')
      // console.log(isTheKeywordASynonym)
      // console.log('isKeywordSynonym end')
      if (isTheKeywordASynonym) {
        // Find out the actual keyword
        latestKeyword = parserUtils.getTheKeywordFromSynonym(candidateKeyword, updatedSections)
        // console.log('--------------------------------------------------------------_++++++++')
        // console.log('--------------------------------------------------------------_++++++++')
        // console.log('latestKeyword')
        // console.log(latestKeyword)
        // console.log('latestKeyword end')
        // console.log('--------------------------------------------------------------_++++++++')
        // console.log('--------------------------------------------------------------_++++++++')
      } else {
        latestKeyword = newKeyword
      }


      // latestKeyword = newKeyword
      // if (latestKeyword[latestKeyword.length - 1] === ':')
      //   latestKeyword = latestKeyword.slice(0, -1)

      usedSectionHeaders.push(newKeyword)
      // remove last segment newlyOrientedKeyword

      newlyOrientedWords
        = newlyOrientedWords.filter(p => !(p.keyword.trim().toLowerCase() === previousKeyword.trim().toLowerCase() && p.words.trim().toLowerCase() === wordsOfTheChapter[i - 1].words.trim().toLowerCase()))
    }
    else if (!usedSectionHeaders.includes(segment.words.trim().toLowerCase())
      && i !== 0 && i !== 1
      && parserUtils
        .isTheSegmentASectionHeader(
          sectionHeadersInLowerCase,
          usedSectionHeaders,
          segment.words.trim().toLowerCase(),
          wordsOfTheChapter[i - 1].words.trim().toLowerCase(),
          wordsOfTheChapter[i - 2].words.trim().toLowerCase(),

        )
    ) {
      const newKeyword = `${wordsOfTheChapter[i - 2].words.trim().toLocaleLowerCase()} ${wordsOfTheChapter[i - 1].words.trim().toLocaleLowerCase()} ${segment.words.trim().toLocaleLowerCase()}`
      const previousKeyword = latestKeyword
      const candidateKeyword = newKeyword
      const isTheKeywordASynonym = parserUtils.isKeywordSynonym(candidateKeyword, sectionHeaderOriginals)
      if (isTheKeywordASynonym) {
        // Find out the actual keyword
        latestKeyword = parserUtils.getTheKeywordFromSynonym(candidateKeyword, updatedSections)
      } else {
        latestKeyword = newKeyword
      }
      usedSectionHeaders.push(newKeyword)
      // remove last segment newlyOrientedKeyword
      newlyOrientedWords
        = newlyOrientedWords.filter(p => !(p.keyword.trim().toLowerCase() === previousKeyword.trim().toLowerCase() &&
        (p.words.trim().toLowerCase() === wordsOfTheChapter[i - 1].words.trim().toLowerCase()
        || p.words.trim().toLowerCase() === wordsOfTheChapter[i - 2].words.trim().toLowerCase()
        )))
    } else {
      newlyOrientedWords.push({
        keyword: latestKeyword,
        words: segment.words,
        startTime: segment.startTime,
        endTime: segment.endTime
      })
    }
  })

  // console.log('newlyOrientedWords')
  // console.log(newlyOrientedWords)
  // console.log('newlyOrientedWords end')
  const finalChapters = []

  let tempObject = { segments: [] }
  newlyOrientedWords.forEach((word, i) => {
    if (tempObject.keyword) {
      if (tempObject.keyword !== word.keyword) {
        finalChapters.push(tempObject)
        tempObject = { segments: [] }
        tempObject.keyword = word.keyword
      }
    } else {
      tempObject.keyword = word.keyword
    }
    tempObject.segments.push({
      words: `${word.words} `,
      startTime: word.startTime + cursorTime,
      endTime: word.endTime + cursorTime
    })
    if (i === newlyOrientedWords.length - 1)
      finalChapters.push(tempObject)
  })

  // console.log('finalChapters')
  // console.log(finalChapters)
  // console.log('finalChapters end')

  // Fix it
  if (finalChapters.length===0) {
    finalChapters.push({
      keyword: 'KONTAKTORSAK',
      segments: [
        {words: '', startTime: 0.0, endTime: 0.0}
      ]
    })
  }

  // Fix the case of a section header as per backend data
  const fixedCase = parserUtils.fixedCaseSections(finalChapters, updatedSections)
  // Capitalize the transcript
  // console.log('fixedCase')
  // console.log(fixedCase)
  // console.log('fixedCase end')
  const capitalized = parserUtils.capitalizeSections(fixedCase)
  // console.log('capitalized')
  // console.log(capitalized)
  // console.log('capitalized end')
  return capitalized
  // return capitalized ? setThePunkt(capitalized) : fixedCase
  // return tempChapters

  // return fixedCase
}

export default processChaptersLive
