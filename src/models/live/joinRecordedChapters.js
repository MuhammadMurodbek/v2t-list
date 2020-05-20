const joinRecordedChapters = (previousChapters, latestChapters, timeStamp = 2, chapterId = -9, segmentId) => {
  if (previousChapters.length === 0) return latestChapters
  // In case the text is appended at the end of the previous text
  if (chapterId === -9) {
    return this.appendChapters(previousChapters, latestChapters)
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

    const appendFirstWithRest = this.appendChapters(firstPortion, latestChapters)
    return this.appendChapters(appendFirstWithRest, remainingPortion)
  }
}

export default joinRecordedChapters