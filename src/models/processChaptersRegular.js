/* eslint-disable no-console */
const processChaptersRegular = (chapters, sectionHeaders) => {
  // get the flat string 
  const sectionHeadersInLowerCase = sectionHeaders.map(sectionHeader=>sectionHeader.toLowerCase())
  let wordsOfTheChapter = []
  if(chapters)
    chapters.forEach(chapter=>{
      wordsOfTheChapter.push({words: chapter.keyword, startTime: 0.0, endTime: 0.0})
      chapter.segments.forEach(segment=> {
        wordsOfTheChapter.push({
          words: segment.words, startTime: segment.startTime, endTime: segment.endTime
        })
      })
    }) 

  let usedSectionHeaders = []
  let newlyOrientedWords = []
  let latestKeyword = 'kontaktorsak'
  wordsOfTheChapter.map((segment,i)=>{
    if (
      sectionHeadersInLowerCase.includes(segment.words.trim().toLowerCase())
      && !usedSectionHeaders.includes(segment.words.trim().toLowerCase())
    ) {
      latestKeyword = segment.words.trim().toLowerCase()
      usedSectionHeaders.push(segment.words.trim().toLowerCase())
    } else {
      newlyOrientedWords.push({
        keyword: latestKeyword,     
        words: segment.words.trim().toLowerCase(),
        startTime: segment.startTime,
        endTime: segment.endTime
      })
    }
  })

  console.log('newlyOrientedWords')
  console.log(newlyOrientedWords)
  console.log('newlyOrientedWords end')
  let finalChapters = []
  let tempObject = {segments:[]}
  newlyOrientedWords.forEach(word=> {
    if(tempObject.keyword) {
      if (tempObject.keyword===word.keyword)
        tempObject.segments.push({
          words: word.words, startTime: word.startTime, endTime: word.endTime
        })
      else {
        finalChapters.push(tempObject)
          tempObject = { segments: []}  
        tempObject.keyword = word.keyword  
      }
    } else {
      tempObject.keyword = word.keyword
    }
  })

  console.log('finalObject')
  console.log(finalChapters)
  console.log('finalObject')
    return finalChapters
}


export default processChaptersRegular



// Check if the first keyword not present
