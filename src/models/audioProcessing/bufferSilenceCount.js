const bufferSilenceCount = (channel) => {
  let count = 0
  for (let i = 0; i < channel.length; i += 1) {
    if (channel[i] > -0.001 && channel[i] < 0.001) {
      count += 1
    }
  }
  return count
}

export default bufferSilenceCount
