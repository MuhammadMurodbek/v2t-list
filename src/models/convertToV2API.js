import { TAG_NAMESPACES } from '../components/Tags'

const convertToV2API = (schema, chapters, tags = {}) => {
  const tagFields = Object.entries(tags).reduce((store, [namespace, tags]) => {
    const field = schema.originalFields.find(field => field.name === namespace)
    return store.concat({
      id: field ? field.id : tags.dictionary,
      namespace: tags.dictionary,
      values: tags.values
    })
  }, [])
  const updatedChapters = []
  chapters.forEach((chapter) => {
    if (TAG_NAMESPACES.has(chapter.keyword)) {
      const field = schema.fields.find(field => field.name === chapter.keyword)
      const id = field ? field.id : chapter.keyword
      updatedChapters.push({
        id,
        namespace: id,
        values: chapter.values
      })
    } else {
      const field = schema.fields.find(field => field.name === chapter.keyword)

      let values = []
      if(!chapter.multiselect && chapter.segments.length) {
        values = [{
          value: `${chapter.segments.map(segment => segment.words).join(' ')}`
        }]
      }
      if (chapter.multiselect) {
        values = chapter.values
      }


      updatedChapters.push({
        id: field ? field.id : chapter.keyword,
        values,
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
  return [...updatedChapters, ...tagFields]
}

export default convertToV2API
