/* eslint-disable no-console */

const capitalizedTranscript = (transcript) => transcript.map(
  (chapter) => {
    return {
      ...chapter,
      segments: chapter.segments ?
        chapter.segments.map(
          (segment, i) => {
            if (i === 0) {
              return {
                ...segment,
                words: segment.words.charAt(0).toUpperCase() + segment.words.slice(1)
              }
            } else {
              return { ...segment }
            }
          }) : []
    }
  })

const processChaptersRegular = (chapters, sectionHeaders) => {
  // get the flat string
  if (!sectionHeaders) return chapters
  const sectionHeadersInLowerCase = sectionHeaders.map(sectionHeader=>sectionHeader.toLowerCase())
  const wordsOfTheChapter = []
  if(chapters)
    chapters.forEach(chapter=>{
      wordsOfTheChapter.push({words: chapter.keyword, startTime: 0.0, endTime: 0.0})
      chapter.segments.forEach(segment=> {
        wordsOfTheChapter.push({
          words: segment.words, startTime: segment.startTime, endTime: segment.endTime
        })
      })
    })

  const usedSectionHeaders = []
  const newlyOrientedWords = []
  let latestKeyword = sectionHeaders[0]
  wordsOfTheChapter.forEach((segment)=>{
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

// console.log('newlyOrientedWords')
// console.log(newlyOrientedWords)

  const finalChapters = []
  let tempObject = {segments:[]}
  newlyOrientedWords.forEach((word, i)=> {
    if(tempObject.keyword) {
      if (tempObject.keyword===word.keyword){
        tempObject.segments.push({
          words: `${word.words} `, startTime: word.startTime, endTime: word.endTime
        })
        if (i === newlyOrientedWords.length - 1) finalChapters.push(tempObject)
      }
      else {
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


  // console.log('finalChapters')
  // console.log(finalChapters)
  // Capitalize
  const finalChaptersCapitalized = capitalizedTranscript(finalChapters)
  // Correct the case of the keyword

  return finalChaptersCapitalized
}

export default processChaptersRegular
