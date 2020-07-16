const convertToV1API = ({ id, schemaId, fields }) => {
  const transcriptions = fields ? fields.map(field => {
    const keyword = field.id
    let charIndex = 0
    const segments = field.values.reduce((store, {value}) => {
      return [...store, ...value.replace('\n ', '\n\u200c').split(' ').map(words => {
        const offset = field.offsets ? field.offsets.find(({textStart, textEnd}) =>
          textStart <= charIndex && textEnd > charIndex
        ) : null
        charIndex += words.length + ` `.length
        return {
          words,
          startTime: (offset ? offset.mediaStartMs : 0) / 1000,
          endTime: (offset ? offset.mediaEndMs : 0) / 1000
        }
      })]
    }, [])
    return { keyword, segments }
  }) : [ { keyword: '', segments: [] } ]
  return { id, schemaId, transcriptions }
}

export default convertToV1API
