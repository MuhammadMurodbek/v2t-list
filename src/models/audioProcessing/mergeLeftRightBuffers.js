import interleave from './interleave'
import mergeBuffers from './mergeBuffers'
import interpolateArray from './interpolateArray'


const writeUTFBytes = (view, offset, string) => {
  const lng = string.length
  for (let i = 0; i < lng; i += 1) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

const mergeLeftRightBuffers = (config, callback) => {
  const { numberOfAudioChannels, internalInterleavedLength, desiredSampRate } = config
  let leftBuffers = config.leftBuffers.slice(0)
  let rightBuffers = config.rightBuffers.slice(0)
  let { sampleRate } = config

  if (numberOfAudioChannels === 2) {
    leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength)
    rightBuffers = mergeBuffers(rightBuffers, internalInterleavedLength)
    if (desiredSampRate) {
      leftBuffers = interpolateArray(leftBuffers, desiredSampRate, sampleRate)
      rightBuffers = interpolateArray(rightBuffers, desiredSampRate, sampleRate)
    }
  }

  if (numberOfAudioChannels === 1) {
    leftBuffers = mergeBuffers(leftBuffers, internalInterleavedLength)
    if (desiredSampRate) {
      leftBuffers = interpolateArray(leftBuffers, desiredSampRate, sampleRate)
    }
  }

  // set sample rate as desired sample rate
  if (desiredSampRate) {
    sampleRate = desiredSampRate
  }
  let interleaved

  if (numberOfAudioChannels === 2) {
    interleaved = interleave(leftBuffers, rightBuffers)
  }

  if (numberOfAudioChannels === 1) {
    interleaved = leftBuffers
  }

  const interleavedLength = interleaved.length

  // create wav file
  const resultingBufferLength = 44 + interleavedLength * 2
  const buffer = new ArrayBuffer(resultingBufferLength)
  const view = new DataView(buffer)

  // RIFF chunk descriptor/identifier
  writeUTFBytes(view, 0, 'RIFF')

  // RIFF chunk length
  view.setUint32(4, 44 + interleavedLength * 2, true)

  // RIFF type
  writeUTFBytes(view, 8, 'WAVE')

  // format chunk identifier
  // FMT sub-chunk
  writeUTFBytes(view, 12, 'fmt ')

  // format chunk length
  view.setUint32(16, 16, true)

  // sample format (raw)
  view.setUint16(20, 1, true)

  // stereo (2 channels)
  view.setUint16(22, numberOfAudioChannels, true)

  // sample rate
  view.setUint32(24, sampleRate, true)

  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true)

  // block align (channel count * bytes per sample)
  view.setUint16(32, numberOfAudioChannels * 2, true)

  // bits per sample
  view.setUint16(34, 16, true)

  // data sub-chunk
  // data chunk identifier
  writeUTFBytes(view, 36, 'data')

  // data chunk length
  view.setUint32(40, interleavedLength * 2, true)

  // write the PCM samples
  const lng = interleavedLength
  let index = 44
  const volume = 1

  for (let i = 0; i < lng; i += 1) {
    view.setInt16(index, interleaved[i] * (0x7FFF * volume), true)
    index += 2
  }
  callback(buffer, view)
}

export default mergeLeftRightBuffers
