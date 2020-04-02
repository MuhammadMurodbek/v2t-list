let chunks = []
let mediaRecorder

const init =  (stream, addClip) => {
  if(!mediaRecorder)
    mediaRecorder = new MediaRecorder(stream)

  mediaRecorder.onstop = function() {
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
  if(mediaRecorder.state === 'inactive'){
    mediaRecorder.start()
  }
}

function stop() {
  if(mediaRecorder.state === 'recording'){
    mediaRecorder.stop()
  }
}

export { init, start, stop }