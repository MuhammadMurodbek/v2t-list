const reduceSegment = (store, segment) => {
  const lastSegment = store[store.length - 1]
  if (lastSegment && !/(\u200c| )/.test(lastSegment.words.slice(-1))) {
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
