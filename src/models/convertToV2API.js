import { CODE_NAMESPACES } from '../components/Tags'

const convertToV2API = (schema, chapters, tags = {}) => {
  const tagFields = Object.entries(tags).reduce((store, [tagType, tags]) => {
    const id = CODE_NAMESPACES[tagType]
    return store.concat({
      id,
      namespace: id,
      values: tags
    })
  }, [])
  const updatedChapters = []
  chapters.forEach((chapter) => {
    if (Object.values(CODE_NAMESPACES).includes(chapter.keyword)) {
      const field = schema.fields.find(field => field.name === chapter.keyword)
      const id = field ? field.id : chapter.keyword
      updatedChapters.push({
        id,
        namespace: id,
        values: chapter.values
      })
    } else {
      const field = schema.fields.find(field => field.name === chapter.keyword)
      updatedChapters.push({
        id: field ? field.id : chapter.keyword,
        values: chapter.segments.length ? [{
          value: `${chapter.segments.map(segment => segment.words).join(' ')}`
        }] : chapter.values || [],
        offsets: chapter.segments.map((segment, i) => {
          if (!segment.startTime && !segment.endTime) return null
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
        }).filter(offset => offset)
      })
    }
  })
  return [ ...updatedChapters, ...tagFields ]
}

export default convertToV2API
