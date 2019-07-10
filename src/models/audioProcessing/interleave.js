const interleave = (leftChannel, rightChannel) => {
  const length = leftChannel.length + rightChannel.length
  const result = new Float64Array(length)
  let inputIndex = 0
  for (let index = 0; index < length;) {
    result[index += 1] = leftChannel[inputIndex]
    result[index += 1] = rightChannel[inputIndex]
    inputIndex += 1
  }
  return result
}

export default interleave
