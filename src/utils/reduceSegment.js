const reduceSegment = (store, segment, i, array) => {
  const lastSegment = store[store.length - 1]
  if (lastSegment && !/(\u200c| )/.test(lastSegment.words.slice(-1))) {
    store[store.length - 1] = mergeSegments(lastSegment, segment)
  } else if (array.length === 1 && segment.words === '\n') {
    store.push({ ...segment, words: '\n\u200c' }) //no characters to merge with
  } else if (i === array.length - 1 && segment.words === '\n') {
    store[store.length - 1] = mergeSegments(lastSegment, segment)
  } else if (segment.words.length) {
    store.push(segment)
  }
  return store
}

const mergeSegments = (lastSegment, segment) => (
  {
    ...lastSegment,
    endTime: segment.endTime,
    words: `${lastSegment.words}${segment.words}`
  }
)

export default reduceSegment
