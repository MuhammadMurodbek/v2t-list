import interpolateArray from "../models/interpolateArray";

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
  // previousAudioLength = 0,
  previousBuffers = []

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
      input = interpolateArray(input, 44100, 44100)
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

export function stop(addClip, timeStamp) {
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
  
  const blob = exportWAV('audio/wav; codecs=opus', timeStamp)
  const audioURL = window.URL.createObjectURL(blob)
  addClip({
    src: audioURL,
    name: clipName
  })
  
}

function exportWAV(type, timeStamp) {
  const buffers = []
  for (let channel = 0; channel < numChannels; channel++) {
    if (timeStamp!==0)
      buffers.push(mergeBuffers(recBuffers[channel], recLength, timeStamp))
    else
      buffers.push(mergeBuffers(recBuffers[channel], recLength))

  }
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

function mergeBuffers(recBuffers, recLength, timeStamp = Math.ceil(previousBuffers.length/46.6)) {
  const previousDuration = previousBuffers.length / 46.6
  const result = new Float32Array(recLength)
  let offset = 0
  
  for (let i = 0, j = 0,k=0; i < recBuffers.length; i++) {
    if (previousDuration!==0) {
      if (Math.ceil(i / 46.6) < timeStamp) {
        result.set(recBuffers[i], offset)
        offset += recBuffers[i].length
        j=i
      }  else {

        // Now is the magic, append the latest audio after timestamp
        if (recBuffers[previousBuffers.length + k]){          
          result.set(recBuffers[previousBuffers.length+k], offset)
          offset += recBuffers[previousBuffers.length + k].length
          k+=1
        } else {
          result.set(recBuffers[j], offset)
          offset += recBuffers[j].length
          j += 1
        }
      }
    }
    else {
      result.set(recBuffers[i], offset)
      offset += recBuffers[i].length
    }
    
  }
  previousBuffers = recBuffers.slice() // Copy array by value


  return result
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