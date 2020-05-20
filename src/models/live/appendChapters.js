const appendChapters = (previousChapters, latestChapters) => {
  if (previousChapters.length === 0) return latestChapters
  const finalKeyword = previousChapters[previousChapters.length - 1].keyword
  const intermediateChapters = JSON.parse(JSON.stringify(previousChapters)) // copy by value
  let temporaryChapter = {}

  latestChapters.forEach((chapter, i) => {
    if (i === 0) {
      if (
        latestChapters[i].keyword === 'KONTAKTORSAK' 
        || latestChapters[i].keyword === finalKeyword
      ) {
        latestChapters[i].segments.forEach(seg => {
          intermediateChapters[intermediateChapters.length - 1].segments.push(seg)
        })
      } else {
        temporaryChapter.keyword = latestChapters[i].keyword
        temporaryChapter.segments = latestChapters[i].segments
        intermediateChapters.push(temporaryChapter)
        temporaryChapter = {}
      }
    } else {
      temporaryChapter.keyword = latestChapters[i].keyword
      temporaryChapter.segments = latestChapters[i].segments
    }
    if (i !== 0) {
      intermediateChapters.push(temporaryChapter)
      temporaryChapter = {}
    }
  })
  return intermediateChapters
}
export default appendChapters