/* eslint-disable no-console */
const processTagsLive = (text, existingTags, updateProbableTags) => {
  // Check regex letter and three numbers
  const machedPatterns = text.match(/\b([a-zA-Z] *\d *\d *\d)\b/g)
  if (machedPatterns) updateProbableTags(machedPatterns)
  return text
}

export default processTagsLive
