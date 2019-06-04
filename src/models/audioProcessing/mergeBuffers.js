const mergeBuffers = (channelBuffer, rLength) => {
  const result = new Float64Array(rLength)
  let offset = 0
  const lng = channelBuffer.length
  for (let i = 0; i < lng; i += 1) {
    const buffer = channelBuffer[i]
    result.set(buffer, offset)
    offset += buffer.length
  }
  return result
}

export default mergeBuffers
