/* eslint-disable no-console */
import api from '../api'

/**
  Word boundry with 4 or 5 chars with possible separators (eg. whitespace or dots).
  Only the second to last char is always a digit.
**/
const REGEX = /\b([a-zA-Z] *[a-zA-Z\d]{0,1} *[a-zA-Z\d] *(\.|,)? *\d *(\.|,)?[a-zA-Z\d])\b/g

const processTagsLive = async (text, existingTags, onUpdateTags, tagRequestCache, onUpdateTagRequestCache) => {
  let needUpdate = false
  const tags = await Object.entries(existingTags).reduce(async (store, [namespace, { values }]) => {
    values = values || []
    const accumulator = await store
    const newTags = await processTagType(text, namespace, values, tagRequestCache, onUpdateTagRequestCache)
    if (newTags.length)
      needUpdate = true
    accumulator[namespace] = [...values, ...newTags]
    return Promise.resolve(accumulator)
  }, Promise.resolve({}))
  if (needUpdate) {
    onUpdateTags(tags)
  }
}

const processTagType = async (text, namespace, existingTags, tagRequestCache, onUpdateTagRequestCache) => {
  const match = text.match(REGEX) || []
  const filteredMatch = match.map(hit => hit.replace(/[\W_]+/g, '').toLowerCase())
    .filter(match => !existingTags.some(({value}) => value.toLowerCase() === match))
  const tags = await Promise.all(filteredMatch.map(async (pattern) =>
    await loadTag(namespace, pattern, tagRequestCache, onUpdateTagRequestCache)
  ))
  return tags.filter(tag => tag)
}

const loadTag = async (namespace, pattern, tagRequestCache, onUpdateTagRequestCache) => {
  const cacheKey = `${namespace}-${pattern}`
  const codeData = tagRequestCache[cacheKey] || await api.keywordsSearch(pattern, namespace)
  if (!tagRequestCache[cacheKey])
    onUpdateTagRequestCache(cacheKey, codeData)
  if (codeData && codeData.data && codeData.data.length > 0)
    return codeData.data.filter(tagValue => tagValue.value.trim().toLowerCase() === pattern.replace(/\s+/g, '').toLowerCase())[0]
}

export default processTagsLive
