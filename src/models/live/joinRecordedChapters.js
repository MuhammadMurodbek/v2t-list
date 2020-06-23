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

const joinRecordedChapters = (previousChapters, latestChapters, timeStamp = 2, chapterId = -9, segmentId) => {
  if (previousChapters.length === 0) return latestChapters
  if (previousChapters[0].segments)
    if (previousChapters[0].segments.length===0) {
      return latestChapters
    }
  // In case the text is appended at the end of the previous text
  if (chapterId === -9) {
    return appendChapters(previousChapters, latestChapters)
  } else {
    // There should be three parts , first part, middle part and final part
    let firstPortion = []
    let tempFirstPortion = { keyword: '', segments: [] }
    const firstPart = JSON.parse(JSON.stringify(previousChapters))
    firstPart.forEach((ch, i) => {
      if (i < chapterId) {
        tempFirstPortion.keyword = ch.keyword
        tempFirstPortion.segments = ch.segments
      } else if (i === chapterId) {
        tempFirstPortion.keyword = ch.keyword
        ch.segments.forEach((seg, k) => {
          if (k <= segmentId)
            tempFirstPortion.segments.push(seg)
        })
      }
      if (tempFirstPortion.segments.length > 0)
        firstPortion.push(tempFirstPortion)
      tempFirstPortion = { keyword: '', segments: [] }
    })

    // Determine the remaining portion
    let remainingPortion = []
    let tempRemainingPortion = { keyword: '', segments: [] }
    firstPart.forEach((ch, i) => {
      if (i === chapterId) {
        tempRemainingPortion.keyword = ch.keyword
        ch.segments.forEach((seg, k) => {
          if (k > segmentId)
            tempRemainingPortion.segments.push(seg)
        })
      } else if (i > chapterId) {
        tempRemainingPortion.keyword = ch.keyword
        tempRemainingPortion.segments = ch.segments
      }
      if (tempRemainingPortion.segments.length > 0) {
        remainingPortion.push(tempRemainingPortion)
      }
      tempRemainingPortion = { keyword: '', segments: [] }
    })

    const appendFirstWithRest = appendChapters(firstPortion, latestChapters)
    return appendChapters(appendFirstWithRest, remainingPortion)
  }
}

export default joinRecordedChapters