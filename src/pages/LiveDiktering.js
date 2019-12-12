import React, { Component } from 'react'
import { EuiSpacer, EuiFlexGroup, EuiFlexItem } from '@elastic/eui'
import api from '../api'
import Editor from '../components/Editor'
import Mic from '../components/Mic'

import LiveTemplateEngine from '../components/LiveTemplateEngine'
import io from 'socket.io-client';
import Page from '../components/Page'

export default class LiveDikterin2 extends Component {
  AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext = new AudioContext()
  socketio = io.connect('wss://ilxgpu9000.inoviaai.se/audio', { transports: ['websocket'] })

  state = {
    recording: false,
    recordingAction: 'start',
    microphoneBeingPressed: false,
    listOfTemplates: [],
    chapters: [{ keyword: "KONTAKTORSAK", segments: [{ words: "...", startTime: 0.00, endTime: 0.00 }] }],
    originalText: '',
    currentText: '',
    sections: ["KONTAKTORSAK", "AT", "LUNGOR", "BUK", "DIAGNOS"]
  }

  componentDidMount = () => {
    this.templates()
    document.title = 'Inovia AI :: Live Diktering 🎤'
  }

  templates = async () => {
    const templateList = await api.getSectionTemplates()
    console.log('templateList')
    console.log(templateList.data.templates)
    this.setState({ listOfTemplates: templateList.data.templates })
  }

  onSelectText = () => {
    // update later
  }

  onUpdateTranscript = (chapters) => {
    // micStream.stop()
    this.setState({ chapters })
  }

  linearInterpolate = (before, after, atPoint) => {
    return before + (after - before) * atPoint;
  }

  // for changing the sampling rate, reference:
  // http://stackoverflow.com/a/28977136/552182
  interpolateArray = (data, newSampleRate, oldSampleRate) => {
    var fitCount = Math.round(data.length * (newSampleRate / oldSampleRate));
    //var newData = new Array();
    var newData = [];
    //var springFactor = new Number((data.length - 1) / (fitCount - 1));
    var springFactor = Number((data.length - 1) / (fitCount - 1));
    newData[0] = data[0]; // for new allocation
    for (var i = 1; i < fitCount - 1; i++) {
      var tmp = i * springFactor;
      //var before = new Number(Math.floor(tmp)).toFixed();
      //var after = new Number(Math.ceil(tmp)).toFixed();
      var before = Number(Math.floor(tmp)).toFixed();
      var after = Number(Math.ceil(tmp)).toFixed();
      var atPoint = tmp - before;
      newData[i] = this.linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
  }

  convertToMono = (input) => {
    var splitter = this.audioContext.createChannelSplitter(2);
    var merger = this.audioContext.createChannelMerger(2);
    input.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);
    return merger;
  }
  
  updatedSections = (sections) => {
    this.setState({ sections }) 
  }

  processChapters = (finalText) => {
    const { sections } = this.state
    console.log(finalText)
    const arrayList = sections
    const words = finalText.split(' ')
    let tempChapters = [{ keyword: "KONTAKTORSAK", segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] }]
    words.forEach((word)=>{
      if (arrayList.includes(word.toUpperCase())){
        tempChapters.push({ keyword: word.toUpperCase(), segments: [{ words: '', startTime: 0.00, endTime: 0.00 }] })
      } else { 
        tempChapters[tempChapters.length - 1].segments[0].words = `${tempChapters[tempChapters.length - 1].segments[0].words}  ${word}`
      }
    })
    console.log('tempChapters')
    console.log(tempChapters)
    return tempChapters
  }

  gotStream = (stream) => {
    const { recording } = this.state
    let inputPoint = this.audioContext.createGain();
    
    // Create an AudioNode from the stream.
    let realAudioInput = this.audioContext.createMediaStreamSource(stream);
    let audioInput = realAudioInput;

    audioInput = this.convertToMono(audioInput);
    audioInput.connect(inputPoint);

    let analyserNode = this.audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect(analyserNode);

    let scriptNode = (this.audioContext.createScriptProcessor || this.audioContext.createJavaScriptNode).call(this.audioContext, 1024, 1, 1);
    let prevState = this
    scriptNode.onaudioprocess = function (audioEvent) {
      if (recording === true) {
        let input = audioEvent.inputBuffer.getChannelData(0);
        input = prevState.interpolateArray(input, 16000, 44100)
        // convert float audio data to 16-bit PCM
        var buffer = new ArrayBuffer(input.length * 2)
        var output = new DataView(buffer);
        for (var i = 0, offset = 0; i < input.length; i++ , offset += 2) {
          var s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        // console.log(buffer)
        prevState.socketio.emit('write-audio', buffer)
      }
    }
    inputPoint.connect(scriptNode)
    scriptNode.connect(this.audioContext.destination)
    let zeroGain = this.audioContext.createGain();
    zeroGain.gain.value = 0.0
    inputPoint.connect(zeroGain);
    zeroGain.connect(this.audioContext.destination);
    // updateAnalysers();
    this.socketio.on('add-transcript', function (text) {
      // add new recording to page
      console.log('text')
      console.log(text)
      const { originalText } = prevState.state
      prevState.setState({ currentText: text }, ()=>{
        console.log('prevState.state.whole')
        const finalText = `${originalText} ${prevState.state.currentText}`
        console.log(finalText)
        prevState.setState({ chapters: prevState.processChapters(finalText) })
      })
      // prevState.setState({ chapters: [{ keyword: "KONTAKTORSAK", segments: [{ words: text, startTime: 0.00, endTime: 0.00 }] }] })
    });
  }

  initAudio = () => {
    if (!navigator.getUserMedia)
      navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
      navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
      navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia({ audio: true }, this.gotStream, function (e) {
      alert('Error getting audio');
      console.log(e);
    });
  }


  toggleRecord = () => {
    const { microphoneBeingPressed, originalText, currentText } = this.state
    if (microphoneBeingPressed === true) {
      this.setState({ microphoneBeingPressed: false })
      this.setState({ recordingAction: 'start' })
      // Close the socket
      this.socketio.emit('end-recording')
      this.socketio.close()
      this.setState({ originalText: `${originalText} ${currentText}`})
        } else {
      this.setState({ recording: true }, ()=> {
        this.setState({ microphoneBeingPressed: true })
        this.setState({ recordingAction: 'stop' })
        this.initAudio()
        console.log('button is clicked')
        this.socketio.emit('start-recording', {
          numChannels: 1,
          bps: 16,
          fps: parseInt(this.audioContext.sampleRate)
        })
      })   
    }
  }

  render() {
    const { chapters, recordingAction, microphoneBeingPressed, listOfTemplates, sections } = this.state
    const usedSections = chapters.map(chapter => chapter.keyword)
    console.log(usedSections)
    return (
      <Page preferences title="">
        <EuiFlexGroup >
          <EuiFlexItem>
            <Editor
              transcript={chapters}
              originalChapters={chapters}
              chapters={chapters}
              currentTime={0.00}
              onSelect={this.onSelectText}
              updateTranscript={this.onUpdateTranscript}
              isDiffVisible={false}
              sectionHeaders={sections}
              initialCursor={0}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 230, marginLeft: 30 }}>
            <EuiSpacer size="l" />
              <Mic
                recordingAction={recordingAction}
                microphoneBeingPressed={microphoneBeingPressed}
                toggleRecord={this.toggleRecord}
              />
              <EuiSpacer size="l" />
            <LiveTemplateEngine listOfTemplates={listOfTemplates} usedSections={usedSections} updatedSections={this.updatedSections} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Page>
  )}
}


