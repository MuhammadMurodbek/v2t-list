const getCorrectKeyword = (keyword, updatedSections) => {
  const allTheKeywords = Object.keys(updatedSections)
  // Remaining task
  // use the values of the object to confirm as keyword
  const keywords = allTheKeywords.map(section =>
    section.toUpperCase().includes(keyword.toUpperCase()) ? section : ''
  )
  const correctCasedKeyword = keywords.filter(k => k.length > 0)[0]
  return correctCasedKeyword
}

const fixedCaseSections = (tempChapters, updatedSectionNames) => {
  return tempChapters.map(({ keyword, segments }) => {
    return {
      keyword: getCorrectKeyword(keyword, updatedSectionNames),
      segments: segments[segments.length - 1].words === '\n ' ? segments.slice(0, segments.length - 1) : segments
    }
  })
}

const extractedText = (finalText) => {
  const data = JSON.parse(finalText)
  if (data) {
    if (data.length > 0)
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

const capitalize = (str) => str
  .trim().charAt(0).toUpperCase() + str.trim().slice(1)

const capitalizeSections = (tempChapters) => {
  return tempChapters.map(({ keyword, segments }) => {
    return {
      keyword,
      segments: segments.map((segment, i) => {
        if (i === 0) {
          return {
            words: `${capitalize(segment.words)} `,
            startTime: segment.startTime,
            endTime: segment.endTime
          }
        }
        else return segment
      })
    }
  })
}

const isTheSegmentASectionHeader = (
  sectionHeadersInLowerCase, usedSectionHeaders, word, previousWord, previousWordSecond=null
) => {
  const newKeyword = previousWordSecond ?
    `${previousWordSecond} ${previousWord} ${word}`.trim().toLocaleLowerCase()
    : `${previousWord} ${word}`.trim().toLocaleLowerCase()

  if (sectionHeadersInLowerCase.includes(newKeyword)) return true
  return false
}


const isKeywordSynonym = (word, sectionHeaderOriginals) => {
  return sectionHeaderOriginals.includes(word.trim().toLowerCase()) ? false : true
}


const getTheKeywordFromSynonym = (word, updatedSections) => {
  const synonymTree = {}
  Object.keys(updatedSections).forEach(k => {
    updatedSections[k].forEach(m => { synonymTree[m.trim().toLowerCase()] = k })
  })

  return synonymTree[word.toLowerCase()]
}


export default {
  fixedCaseSections, extractedText, capitalizeSections, isTheSegmentASectionHeader,
  isKeywordSynonym, getTheKeywordFromSynonym
}
