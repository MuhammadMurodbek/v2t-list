let chunks = []
let mediaRecorder

const init =  (stream, addClip) => {
  if(!mediaRecorder)
    mediaRecorder = new MediaRecorder(stream)

  mediaRecorder.onstop = function(e) {
    const currentTime = new Date()
    const year = currentTime.getFullYear()
    const month = currentTime.getMonth() + 1
    const day = currentTime.getDate()
    const hour = currentTime.getHours()
    const min = currentTime.getMinutes()
    const sec = currentTime.getSeconds()
    const clipName =
      `Clip ${year}/${month}/${day} ${hour}:${min}:${sec}`

    const blob = new Blob(chunks, { 'type' : 'audio/wav; codecs=opus' })
    chunks = []
    const audioURL = window.URL.createObjectURL(blob)
    addClip({
      src: audioURL,
      name: clipName
    })
  }

  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data)
  }
}

function start() {
  mediaRecorder.start()
}

function stop() {
  mediaRecorder.stop()
}

export { init, start, stop }