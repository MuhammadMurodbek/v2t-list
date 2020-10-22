const reduceSegment = (store, segment) => {
  const lastSegment = store[store.length - 1]
  const hasLastSegment = lastSegment && !/[\u200C]/g.test(lastSegment.words)
  if (hasLastSegment && lastSegment.words.slice(-1) !== ' ') {
    store[store.length - 1] = {
      ...lastSegment,
      endTime: segment.endTime,
      words: `${lastSegment.words}${segment.words}`
    }
  } else if (segment.words.length) {
    store.push(segment)
  }
  return store
}

export default reduceSegment
