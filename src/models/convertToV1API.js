/* eslint-disable max-len */
/* eslint-disable no-console */
const convertToV1API = ({ id, schemaId, fields }, selectedSchemaFields) => {
  console.log(
    '---- ----- ---- ----- ---- ----- ---- ----- ---- ----- ---- ----- ---- -----> ',
    fields
  )
  console.log('schemaId', schemaId)
  console.log(
    'fields-----> ',
    selectedSchemaFields.filter((f) => f.name)
  )
  const multiSelectMap = {}
  selectedSchemaFields.forEach((schemaField) => {
    if(schemaField.multiSelect) { multiSelectMap[schemaField.name]= true }
    else { multiSelectMap[schemaField.name]= false }
  })
  console.log('multiSelectMap', multiSelectMap)
  // get the schema
  const segmentsToBeAddedToTheNextField = []
  const transcriptions = fields
    ? fields.map((field) => {

      if (!multiSelectMap[field.id]) {
        const keyword = field.id
        let charIndex = 0
        const segments = (field.values || []).reduce((store, { value }) => {
          return [
            ...store,
            ...value
              .replace('\n ', '\n\u200c')
              .split(' ')
              .map((words) => {
                const offset = field.offsets
                  ? field.offsets.find(
                    ({ textStart, textEnd }) =>
                      textStart <= charIndex && textEnd > charIndex
                  )
                  : null
                charIndex += words.length + ' '.length
                const updatedWords =
                  segmentsToBeAddedToTheNextField.length > 0
                    ? `${segmentsToBeAddedToTheNextField} ${words}`
                    : words
                segmentsToBeAddedToTheNextField.pop()
                return {
                  words: updatedWords,
                  startTime: (offset ? offset.mediaStartMs : 0) / 1000,
                  endTime: (offset ? offset.mediaEndMs : 0) / 1000
                }
              })
          ]
        }, [])
        return { keyword, segments, values: field.values }
      } else {
        // handle multiselect case
        const keyword = field.id
        console.log('multi select enabled field', field.values[0].value)
        // existing options
        // stack
        
        const options = selectedSchemaFields.filter(
          (f) => f.name === field.id
        )[0].choiceValues
        console.log('existing options', options)
        const sentence = field.values[0].value
        console.log('sentence', sentence)
        const tempSegments = []
        
        options.forEach((option) => {
          // start matching from the beginning
          if (sentence.toLowerCase().includes(option.toLowerCase())) {
            tempSegments.push(option)
          }
        })




        console.log('tempSegments[0]', tempSegments)
        if (tempSegments.length>0) {
          ///// There are matches, add to the segments
          // const unusedTempSegment = tempSegments.
          // segmentsToBeAddedToTheNextField.push(unusedTempSegment)
          return {
            keyword,
            segments: [{ words: tempSegments.join(' ') }],
            values: field.values
          }
          /////


          // if (tempSegments[0].trim().length === sentence.length) {
          //   console.log('yay')
          //   return {
          //     keyword,
          //     segments: [{ words: tempSegments[0] }],
          //     values: field.values
          //   }
          // } else {
          //   console.log('match found, but there are some extra data')
          //   // add to the stack
          //   segmentsToBeAddedToTheNextField.push(
          //     sentence.substring(substringLength, sentence.length).trim()
          //   )
          //   console.log(
          //     'segmentsToBeAddedToTheNextField',
          //     segmentsToBeAddedToTheNextField
          //   )
          //   return {
          //     keyword,
          //     segments: [{ words: tempSegments[0] }],
          //     values: field.values
          //   }
          // }
        } else {
          // not matched at all, pass everything to the next chapter
          console.log('lets the magic begin')
          segmentsToBeAddedToTheNextField.push(sentence)
          return {
            keyword,
            segments: [],
            values: field.values
          }
        }
      }
    })
    : []

  console.log(
    'segmentsToBeAddedToTheNextField',
    segmentsToBeAddedToTheNextField
  )
  console.log('transcriptions', transcriptions)
  return { id, schemaId, transcriptions }
}

export default convertToV1API
