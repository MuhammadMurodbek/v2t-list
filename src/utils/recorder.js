import interpolateArray from '../models/interpolateArray'

const SECOND_TO_BYTE_RATIO = 46.6 / 16

const config = {
  bufferLen: 1024,
  numChannels: 1,
  mimeType: 'audio/wav'
}

let recording = false

let recLength = 0,
  recBuffers = [],
  numChannels = undefined,
  clipName = null,
  previousBuffersLength = 0,
  bufferUnusedSamples = new Float32Array(),
  TARGET_SAMPLE_RATE = 16000

export async function init(stream) {
  numChannels = config.numChannels

  initBuffers()
}

export function record(inputBuffer) {
  for (let channel = 0; channel < numChannels; channel++) {
    recBuffers[channel].push(inputBuffer[channel])
  }
  recLength += inputBuffer[0].length
}

export function start() {
  recording = true
}

export function stop(addClip, timestamp, offset, offsetEnd) {
  recording = false

  if(!clipName) {
    const currentTime = new Date()
    const year = currentTime.getFullYear()
    const month = currentTime.getMonth() + 1
    const day = currentTime.getDate()
    const hour = currentTime.getHours()
    const min = currentTime.getMinutes()
    const sec = currentTime.getSeconds()
    clipName = `Clip ${year}/${month}/${day} ${hour}:${min}:${sec}`
  }

  const prevLength = previousBuffersLength / SECOND_TO_BYTE_RATIO
  const blob = exportWAV('audio/wav; codecs=opus', timestamp, offset, offsetEnd)
  const audioURL = window.URL.createObjectURL(blob)
  const length = previousBuffersLength / SECOND_TO_BYTE_RATIO

  addClip(
    {
      src: audioURL,
      name: clipName
    },
    length - (offset || prevLength || length),
    prevLength - (offset || prevLength)
  )

}

function exportWAV(type, timestamp, offset, offsetEnd) {
  const buffers = []
  for (let channel = 0; channel < numChannels; channel++)
    buffers.push(mergeBuffers(channel, recBuffers[channel], recLength, timestamp, offset, offsetEnd))
  let interleaved = undefined
  if (numChannels === 2) {
    interleaved = interleave(buffers[0], buffers[1])
  } else {
    interleaved = buffers[0]
  }
  const dataView = encodeWAV(interleaved)
  return new Blob([dataView], { type: type })
}

export function clear() {
  recLength = 0
  recBuffers = []
  initBuffers()
}

function initBuffers() {
  for (let channel = 0; channel < numChannels; channel++) {
    recBuffers[channel] = []
  }
}

function mergeBuffers(channel, buffer, recLength, timestamp, offset, offsetEnd) {
  let insertFromByte = Math.floor(timestamp * SECOND_TO_BYTE_RATIO)
  let offsetBytes = offset ? Math.floor((offset) * SECOND_TO_BYTE_RATIO) : previousBuffersLength
  let offsetBytesEnd = buffer.length - Math.floor(offsetEnd * SECOND_TO_BYTE_RATIO)

  // Make sure we don't miss or repeate any audio, even if timestamps are off
  if (offsetBytes < insertFromByte)
    insertFromByte = offsetBytes
  if (offsetBytesEnd < offsetBytes)
    offsetBytesEnd = offsetBytes

  const result = []
  result.push(...buffer.slice(0, insertFromByte))
  result.push(...buffer.slice(offsetBytes, offsetBytesEnd))
  result.push(...buffer.slice(insertFromByte, offsetBytes))
  result.push(...buffer.slice(offsetBytesEnd))

  previousBuffersLength = result.length
  recBuffers[channel] = [...result]

  return result.flat()
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length
  const result = new Float32Array(length)

  let index = 0,
    inputIndex = 0

  while (index < length) {
    result[index++] = inputL[inputIndex]
    result[index++] = inputR[inputIndex]
    inputIndex++
  }
  return result
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function encodeWAV(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, 1, true)
  /* channel count */
  view.setUint16(22, numChannels, true)
  /* sample rate */
  view.setUint32(24, TARGET_SAMPLE_RATE, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, TARGET_SAMPLE_RATE * 4, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true)
  /* bits per sample */
  view.setUint16(34, 16, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true)

  floatTo16BitPCM(view, 44, samples)

  return view
}

export function downsample(sourceSampleRate, bufferNewSamples) {
  let buffer
  const newSamples = bufferNewSamples.length
  const unusedSamples = bufferUnusedSamples.length
  let i
  let offset

  if (unusedSamples > 0) {
    buffer = new Float32Array(unusedSamples + newSamples)
    for (i = 0; i < unusedSamples; ++i) {
      buffer[i] = bufferUnusedSamples[i]
    }
    for (i = 0; i < newSamples; ++i) {
      buffer[unusedSamples + i] = bufferNewSamples[i]
    }
  } else {
    buffer = bufferNewSamples
  }

  // Downsampling and low-pass filter:
  // Input audio is typically 44.1kHz or 48kHz, this downsamples it to 16kHz.
  // It uses a FIR (finite impulse response) Filter to remove (or, at least attinuate)
  // audio frequencies > ~8kHz because sampled audio cannot accurately represent
  // frequiencies greater than half of the sample rate.
  // (Human voice tops out at < 4kHz, so nothing important is lost for transcription.)
  // See http://dsp.stackexchange.com/a/37475/26392 for a good explanation of this code.
  const filter = [
    -0.037935,
    -0.00089024,
    0.040173,
    0.019989,
    0.0047792,
    -0.058675,
    -0.056487,
    -0.0040653,
    0.14527,
    0.26927,
    0.33913,
    0.26927,
    0.14527,
    -0.0040653,
    -0.056487,
    -0.058675,
    0.0047792,
    0.019989,
    0.040173,
    -0.00089024,
    -0.037935
  ]
  const samplingRateRatio = sourceSampleRate / TARGET_SAMPLE_RATE
  const nOutputSamples = Math.floor((buffer.length - filter.length) / samplingRateRatio) + 1
  const outputBuffer = new Float32Array(nOutputSamples)

  for (i = 0; i < outputBuffer.length; i++) {
    offset = Math.round(samplingRateRatio * i)
    let sample = 0
    for (let j = 0; j < filter.length; ++j) {
      sample += buffer[offset + j] * filter[j]
    }
    outputBuffer[i] = sample
  }

  const indexSampleAfterLastUsed = Math.round(samplingRateRatio * i)
  const remaining = buffer.length - indexSampleAfterLastUsed
  if (remaining > 0) {
    bufferUnusedSamples = new Float32Array(remaining)
    for (i = 0; i < remaining; ++i) {
      bufferUnusedSamples[i] = buffer[indexSampleAfterLastUsed + i]
    }
  } else {
    bufferUnusedSamples = new Float32Array(0)
  }

  return outputBuffer
}
