import interpolateArray from '../models/interpolateArray'

const config = {
  bufferLen: 1024,
  numChannels: 1,
  mimeType: 'audio/wav'
}

let recording = false

let recLength = 0,
  recBuffers = [],
  sampleRate = undefined,
  numChannels = undefined,
  clipName = null,
  previousBuffersLength = 0

export async function init(stream) {
  let audioContext = new AudioContext()
  let source = await audioContext.createMediaStreamSource(stream)
  const context = source.context
  sampleRate = context.sampleRate
  numChannels = config.numChannels

  initBuffers()
  const { createScriptProcessor, createJavaScriptNode } = audioContext
  const node = (createScriptProcessor || createJavaScriptNode)
    .call(audioContext, 1024, 1, 1)

  source.connect(node)
  node.connect(context.destination)
  node.onaudioprocess = function (e) {
    if (!recording) return
    let buffer = []
    for (let channel = 0; channel < config.numChannels; channel++) {
      let input = e.inputBuffer.getChannelData(channel)
      input = interpolateArray(input, sampleRate, sampleRate)
      buffer.push(input)
    }
    record(buffer)
  }
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

export function stop(addClip, timestamp, offset) {
  recording = false
  const previousLength = previousBuffersLength / 46.6

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

  const blob = exportWAV('audio/wav; codecs=opus', timestamp, offset)
  const audioURL = window.URL.createObjectURL(blob)
  const length = previousBuffersLength / 46.6

  addClip({
    src: audioURL,
    name: clipName
  }, previousLength === 0 ? 0 : length - previousLength)

}

function exportWAV(type, timestamp, offset) {
  const buffers = []
  for (let channel = 0; channel < numChannels; channel++)
    buffers.push(mergeBuffers(channel, recBuffers[channel], recLength, timestamp, offset))
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

function mergeBuffers(channel, buffer, recLength, timestamp, offset) {
  const insertFromByte = Math.floor(timestamp * 46.6)
  const offsetBytes = Math.floor(offset * 46.6)
  const result = []
  result.push(...buffer.slice(0, insertFromByte))
  result.push(...buffer.slice(previousBuffersLength + offsetBytes))
  result.push(...buffer.slice(insertFromByte, previousBuffersLength + offsetBytes))

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
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true)
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
