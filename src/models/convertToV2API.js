const convertToV2API = (schema, chapters, tags = []) => {
  const tagFields = tags.reduce((store, {namespace: id, id: value, description}) => {
    const i = store.findIndex(field => field.id === id)
    const field = store[i] || { id, values: [] }
    const values = [ ...field.values, { value, description} ]
    store[i >= 0 ? i : store.length] = { ...field, values }
    return store
  }, [])
  const updatedChapters = []
  chapters.forEach((chapter) => {
    const field = schema.fields.find(field => field.name === chapter.keyword)
    updatedChapters.push({
      id: field ? field.id : chapter.keyword,
      values: [{
        value: `${chapter.segments.map(segment => segment.words).join(' ')}`
      }],
      offsets: chapter.segments.map((segment, i) => {
        let previousWordsLength = 0
        for (let j = 0; j < i; j++) {
          previousWordsLength += chapter.segments[j].words.length
        }

        return {
          textStart: previousWordsLength + i,
          textEnd: previousWordsLength + segment.words.length + i,
          mediaStartMs: segment.startTime * 1000,
          mediaEndMs: segment.endTime * 1000
        }
      })
    })
  })
  return [ ...updatedChapters, ...tagFields ]
}

export default convertToV2API
