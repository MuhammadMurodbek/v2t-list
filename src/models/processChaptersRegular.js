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
  wordsOfTheChapter.map(segment=>{
    if (
      sectionHeadersInLowerCase.includes(segment.words.trim().toLowerCase())
      && !usedSectionHeaders.includes(segment.words.trim().toLowerCase())
    ) {
      console.log('word')
      console.log(segment )
      console.log('word')
      usedSectionHeaders.push(segment.words.trim().toLowerCase())
    }
  })
}


export default processChaptersRegular



// Check if the first keyword not present
